/**
 * 综合性能测试工具
 * 测试不使用代理 vs 使用代理的性能对比
 */

const { fetch, ProxyAgent } = require('undici')
require('dotenv').config({ path: '.env.local' })

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY
const MODEL = process.env.GOOGLE_GEMINI_MODEL || 'gemini-2.5-flash'
const PROXY_URL = process.env.GEMINI_PROXY_URL || process.env.HTTPS_PROXY || process.env.HTTP_PROXY

if (!API_KEY || API_KEY === 'your-gemini-api-key') {
  console.error('❌ GOOGLE_GEMINI_API_KEY not configured')
  process.exit(1)
}

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?key=${API_KEY}`

// 测试代理延迟
async function testProxyLatency(proxyUrl) {
  console.log('📡 Testing proxy latency...')
  try {
    const proxyAgent = new ProxyAgent(proxyUrl)
    const startTime = Date.now()
    const response = await fetch('https://www.google.com', {
      dispatcher: proxyAgent,
      signal: AbortSignal.timeout(10000), // 10秒超时
    })
    await response.text() // 等待完整响应
    const endTime = Date.now()
    const latency = endTime - startTime
    console.log(`   ✅ Proxy latency: ${latency}ms`)
    if (latency > 500) {
      console.log(`   ⚠️  High latency! (> 500ms) This may be the main bottleneck.`)
    } else if (latency > 1000) {
      console.log(`   ❌ Very high latency! (> 1000ms) Proxy is likely the main bottleneck.`)
    } else {
      console.log(`   ✅ Latency is acceptable (< 500ms)`)
    }
    return latency
  } catch (e) {
    console.log(`   ❌ Proxy test failed: ${e.message}`)
    return null
  }
}

// 测试 Gemini API 性能
async function testGeminiPerformance(useProxy = false, testName = '') {
  const proxyAgent = useProxy && PROXY_URL ? new ProxyAgent(PROXY_URL) : undefined
  const connectionType = useProxy ? 'WITH PROXY' : 'WITHOUT PROXY'
  
  console.log(`\n${'='.repeat(60)}`)
  console.log(`🚀 Test ${testName}: ${connectionType}`)
  console.log(`${'='.repeat(60)}`)
  if (useProxy) {
    console.log(`Proxy: ${PROXY_URL || 'Not configured'}`)
  } else {
    console.log(`Proxy: Disabled (direct connection)`)
  }
  console.log(`Model: ${MODEL}`)
  console.log()

  try {
    const fetchOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: 'Say hello in one sentence.' }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 20,
          topP: 0.9,
          maxOutputTokens: 100,
        }
      }),
      dispatcher: proxyAgent,
      signal: AbortSignal.timeout(30000), // 30秒超时
    }

    const requestStart = Date.now()
    const response = await fetch(API_URL, fetchOptions)
    const responseReceived = Date.now()
    
    const requestTime = responseReceived - requestStart
    console.log(`📥 Request time: ${requestTime}ms`)
    console.log(`📥 Status: ${response.status}`)
    console.log(`📥 Content-Type: ${response.headers.get('content-type')}`)
    
    if (requestTime > 2000) {
      console.log(`   ⚠️  High request latency! (> 2000ms)`)
    }
    console.log()

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API Error:', errorText)
      return null
    }

    if (!response.body) {
      console.error('❌ No response body')
      return null
    }

    console.log('📊 Measuring stream performance...')
    console.log()

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let firstChunkTime = null
    let firstDataTime = null
    let totalBytes = 0
    let chunkCount = 0
    let firstText = ''

    // TTFB应该从请求开始计算
    const streamStart = requestStart

    while (true) {
      const { done, value } = await reader.read()
      
      if (done) {
        break
      }

      chunkCount++
      totalBytes += value.length
      
      if (!firstChunkTime) {
        firstChunkTime = Date.now()
        const ttfb = firstChunkTime - streamStart
        console.log(`✅ First chunk received (TTFB): ${ttfb}ms`)
        console.log(`   Chunk size: ${value.length} bytes`)
        
        if (ttfb > 1000) {
          console.log(`   ⚠️  High TTFB! (> 1000ms) Network/proxy delay is significant.`)
        } else if (ttfb > 500) {
          console.log(`   ⚠️  Moderate TTFB (> 500ms)`)
        } else {
          console.log(`   ✅ TTFB is good (< 500ms)`)
        }
      }

      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk

      // 尝试解析第一个数据
      if (!firstDataTime) {
        try {
          // 检测数组格式
          if (buffer.trim().startsWith('[')) {
            // 数组格式：查找完整的对象
            const objEndComma = buffer.indexOf('},')
            const objEndBracket = buffer.indexOf('}]')
            
            let objEnd = -1
            if (objEndComma !== -1 && (objEndBracket === -1 || objEndComma < objEndBracket)) {
              objEnd = objEndComma + 1
            } else if (objEndBracket !== -1) {
              objEnd = objEndBracket + 1
            }
            
            if (objEnd !== -1) {
              let objStr = buffer.substring(0, objEnd)
              if (objStr.endsWith(',')) {
                objStr = objStr.slice(0, -1)
              } else if (objStr.endsWith(']')) {
                objStr = objStr.slice(0, -1)
              }
              
              const item = JSON.parse(objStr)
              const text = item?.candidates?.[0]?.content?.parts?.[0]?.text
              if (text) {
                firstDataTime = Date.now()
                firstText = text
                const timeToFirstData = firstDataTime - streamStart
                console.log(`✅ First data extracted: ${timeToFirstData}ms`)
                console.log(`   Text: "${text.substring(0, 50)}..."`)
                
                if (timeToFirstData > 2000) {
                  console.log(`   ⚠️  Slow data extraction! (> 2000ms)`)
                }
              }
            }
          } else {
            // NDJSON格式：查找第一个完整的JSON行
            const lines = buffer.split('\n')
            for (const line of lines) {
              const trimmed = line.trim()
              if (trimmed && trimmed.startsWith('{')) {
                try {
                  const response = JSON.parse(trimmed)
                  const text = response?.candidates?.[0]?.content?.parts?.[0]?.text ||
                               response?.candidates?.[0]?.delta?.content?.parts?.[0]?.text
                  if (text) {
                    firstDataTime = Date.now()
                    firstText = text
                    const timeToFirstData = firstDataTime - streamStart
                    console.log(`✅ First data extracted: ${timeToFirstData}ms`)
                    console.log(`   Text: "${text.substring(0, 50)}..."`)
                    break
                  }
                } catch (e) {
                  // 继续
                }
              }
            }
          }
        } catch (e) {
          // 继续等待
        }
      }
    }

    const streamEnd = Date.now()
    const totalTime = streamEnd - streamStart

    console.log()
    console.log('─'.repeat(60))
    console.log('📊 Performance Summary:')
    console.log('─'.repeat(60))
    console.log(`Total time: ${totalTime}ms (${(totalTime/1000).toFixed(2)}s)`)
    console.log(`Request time: ${requestTime}ms`)
    if (firstChunkTime) {
      const ttfb = firstChunkTime - streamStart
      console.log(`TTFB (Time to First Byte): ${ttfb}ms`)
    }
    if (firstDataTime) {
      const timeToFirstData = firstDataTime - streamStart
      console.log(`Time to first data: ${timeToFirstData}ms`)
    }
    console.log(`Total chunks: ${chunkCount}`)
    console.log(`Total bytes: ${totalBytes}`)
    console.log()

    // 性能评估
    let warnings = []
    if (totalTime > 5000) {
      warnings.push('Total time > 5s')
    }
    if (requestTime > 2000) {
      warnings.push('Request latency > 2s (network/proxy issue)')
    }
    if (firstChunkTime && (firstChunkTime - streamStart) > 2000) {
      warnings.push('TTFB > 2s (network/proxy issue)')
    }
    if (firstDataTime && (firstDataTime - streamStart) > 3000) {
      warnings.push('Time to first data > 3s')
    }

    if (warnings.length > 0) {
      console.log('⚠️  Performance Warnings:')
      warnings.forEach(w => console.log(`   - ${w}`))
      if (useProxy) {
        console.log('   💡 Consider testing without proxy or using a faster proxy')
      }
    } else {
      console.log('✅ Performance is good!')
    }

    return {
      totalTime,
      requestTime,
      ttfb: firstChunkTime ? firstChunkTime - streamStart : null,
      timeToFirstData: firstDataTime ? firstDataTime - streamStart : null,
      chunkCount,
      totalBytes,
      firstText,
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    if (error.name === 'AbortError') {
      console.error('   Request timeout (30s)')
    } else if (error.message.includes('fetch failed')) {
      console.error('   Network connection failed')
      if (!useProxy) {
        console.error('   💡 Direct connection failed. This may indicate:')
        console.error('      - Network firewall blocking Google APIs')
        console.error('      - Need to use proxy')
      } else {
        console.error('   💡 Proxy connection failed. Check proxy configuration.')
      }
    }
    console.error('   Error details:', error.stack || error)
    return null
  }
}

async function runComprehensiveTest() {
  console.log('⚡ Comprehensive Performance Test')
  console.log('='.repeat(60))
  console.log('Model:', MODEL)
  console.log('API Key:', API_KEY.substring(0, 10) + '...')
  console.log('='.repeat(60))

  const results = {}

  // 1. 测试代理延迟（如果配置了代理）
  if (PROXY_URL) {
    console.log('\n📡 Step 1: Testing Proxy Latency')
    console.log('─'.repeat(60))
    const proxyLatency = await testProxyLatency(PROXY_URL)
    results.proxyLatency = proxyLatency
  } else {
    console.log('\n📡 Step 1: No proxy configured')
    console.log('─'.repeat(60))
    console.log('   Skipping proxy latency test')
  }

  // 2. 测试不使用代理（最重要）
  console.log('\n\n🔍 Step 2: Testing WITHOUT Proxy (Most Important)')
  console.log('─'.repeat(60))
  const resultWithoutProxy = await testGeminiPerformance(false, '1')
  results.withoutProxy = resultWithoutProxy

  // 3. 测试使用代理（如果配置了）
  if (PROXY_URL) {
    console.log('\n\n🔍 Step 3: Testing WITH Proxy')
    console.log('─'.repeat(60))
    const resultWithProxy = await testGeminiPerformance(true, '2')
    results.withProxy = resultWithProxy

    // 4. 性能对比
    console.log('\n\n📊 Step 4: Performance Comparison')
    console.log('='.repeat(60))
    if (resultWithoutProxy && resultWithProxy) {
      const timeDiff = resultWithProxy.totalTime - resultWithoutProxy.totalTime
      const ttfbDiff = (resultWithProxy.ttfb || 0) - (resultWithoutProxy.ttfb || 0)
      
      console.log('Comparison:')
      console.log(`  Total time difference: ${timeDiff > 0 ? '+' : ''}${timeDiff}ms`)
      console.log(`  TTFB difference: ${ttfbDiff > 0 ? '+' : ''}${ttfbDiff}ms`)
      console.log()
      
      if (timeDiff > 2000) {
        console.log('⚠️  Proxy adds significant delay (> 2s)')
        console.log('   💡 Recommendation: Consider using a faster proxy or disabling proxy if possible')
      } else if (timeDiff > 0) {
        console.log('ℹ️  Proxy adds moderate delay')
        console.log('   💡 Consider optimizing proxy or testing different proxy servers')
      } else {
        console.log('✅ Proxy does not significantly impact performance')
      }
    }
  }

  // 5. 最终建议
  console.log('\n\n💡 Final Recommendations')
  console.log('='.repeat(60))
  
  if (resultWithoutProxy) {
    if (resultWithoutProxy.totalTime < 3000) {
      console.log('✅ Direct connection is fast (< 3s)')
      if (PROXY_URL) {
        console.log('   💡 If proxy is slower, consider disabling it if network allows')
      }
    } else if (resultWithoutProxy.totalTime < 5000) {
      console.log('⚠️  Direct connection is moderate (3-5s)')
      console.log('   💡 May need optimization or better network')
    } else {
      console.log('❌ Direct connection is slow (> 5s)')
      console.log('   💡 Check network connection and API endpoint')
    }
  }

  if (results.proxyLatency) {
    if (results.proxyLatency > 1000) {
      console.log('❌ Proxy latency is very high (> 1s)')
      console.log('   💡 Proxy is likely the main bottleneck')
      console.log('   💡 Consider:')
      console.log('      - Using a faster proxy server')
      console.log('      - Using a proxy closer to your location')
      console.log('      - Disabling proxy if network allows')
    } else if (results.proxyLatency > 500) {
      console.log('⚠️  Proxy latency is high (> 500ms)')
      console.log('   💡 Proxy may be contributing to delays')
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('Test completed!')
  console.log('='.repeat(60))
}

runComprehensiveTest().catch(console.error)

