/**
 * 测试不使用代理的性能（最重要）
 * 临时禁用代理，测试直接连接的速度
 */

const { fetch } = require('undici')
require('dotenv').config({ path: '.env.local' })

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY
const MODEL = process.env.GOOGLE_GEMINI_MODEL || 'gemini-2.5-flash'

if (!API_KEY || API_KEY === 'your-gemini-api-key') {
  console.error('❌ GOOGLE_GEMINI_API_KEY not configured')
  process.exit(1)
}

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?key=${API_KEY}`

console.log('🚀 Testing WITHOUT Proxy (Direct Connection)')
console.log('='.repeat(60))
console.log('Model:', MODEL)
console.log('Proxy: DISABLED (direct connection)')
console.log('='.repeat(60))
console.log()

async function testDirectConnection() {
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
      signal: AbortSignal.timeout(30000), // 30秒超时
    }

    console.log('📤 Sending request (NO PROXY)...')
    const requestStart = Date.now()
    
    const response = await fetch(API_URL, fetchOptions)
    const responseReceived = Date.now()
    
    const requestTime = responseReceived - requestStart
    console.log(`📥 Request time: ${requestTime}ms`)
    console.log(`📥 Status: ${response.status}`)
    console.log(`📥 Content-Type: ${response.headers.get('content-type')}`)
    console.log()

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API Error:', errorText)
      return
    }

    if (!response.body) {
      console.error('❌ No response body')
      return
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

    const streamStart = requestStart // TTFB从请求开始计算

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
          console.log(`   ⚠️  High TTFB! (> 1000ms) Network delay is significant.`)
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
    console.log('='.repeat(60))
    console.log('📊 Performance Summary (NO PROXY):')
    console.log('='.repeat(60))
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
    if (totalTime < 3000) {
      console.log('✅ Performance is EXCELLENT! (< 3s)')
      console.log('   💡 Direct connection is fast. Consider disabling proxy if possible.')
    } else if (totalTime < 5000) {
      console.log('✅ Performance is GOOD (3-5s)')
      console.log('   💡 Direct connection is acceptable.')
    } else if (totalTime < 10000) {
      console.log('⚠️  Performance is MODERATE (5-10s)')
      console.log('   💡 May need optimization.')
    } else {
      console.log('❌ Performance is SLOW (> 10s)')
      console.log('   💡 Check network connection and API endpoint.')
    }

    if (firstChunkTime && (firstChunkTime - streamStart) > 2000) {
      console.log('⚠️  High TTFB (> 2s) - Network delay is significant')
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    if (error.name === 'AbortError') {
      console.error('   Request timeout (30s)')
    } else if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
      console.error('   Network connection failed')
      console.error('   💡 Direct connection failed. This may indicate:')
      console.error('      - Network firewall blocking Google APIs')
      console.error('      - Need to use proxy')
      console.error('      - Check internet connection')
    }
    console.error('   Error details:', error.stack || error)
  }
}

testDirectConnection().catch(console.error)

