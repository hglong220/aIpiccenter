/**
 * 性能测试工具
 * 测试 Gemini API 的实际响应时间
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

async function testPerformance() {
  console.log('⚡ Performance Test - Gemini API')
  console.log('=' .repeat(60))
  console.log('Model:', MODEL)
  console.log('Proxy:', PROXY_URL || 'None (direct connection)')
  console.log('=' .repeat(60))
  console.log()

  // 测试代理延迟
  if (PROXY_URL) {
    console.log('📡 Testing proxy latency...')
    try {
      const proxyAgent = new ProxyAgent(PROXY_URL)
      const startTime = Date.now()
      const response = await fetch('https://www.google.com', {
        dispatcher: proxyAgent,
      })
      const endTime = Date.now()
      const latency = endTime - startTime
      console.log(`   Proxy latency: ${latency}ms`)
      if (latency > 500) {
        console.log(`   ⚠️  High latency! This may be the main bottleneck.`)
      }
      console.log()
    } catch (e) {
      console.log(`   ❌ Proxy test failed: ${e.message}`)
      console.log()
    }
  }

  // 测试 Gemini API 响应时间
  console.log('🚀 Testing Gemini API response time...')
  console.log()

  try {
    const proxyAgent = PROXY_URL ? new ProxyAgent(PROXY_URL) : undefined
    
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
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 100,
        }
      }),
      dispatcher: proxyAgent,
    }

    const requestStart = Date.now()
    const response = await fetch(API_URL, fetchOptions)
    const requestEnd = Date.now()
    
    console.log(`📥 Request time: ${requestEnd - requestStart}ms`)
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

    const streamStart = Date.now()

    while (true) {
      const { done, value } = await reader.read()
      
      if (done) {
        break
      }

      chunkCount++
      totalBytes += value.length
      
      if (!firstChunkTime) {
        firstChunkTime = Date.now()
        console.log(`✅ First chunk received: ${firstChunkTime - streamStart}ms`)
        console.log(`   Chunk size: ${value.length} bytes`)
      }

      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk

      // 尝试解析第一个数据
      if (!firstDataTime) {
        try {
          // 查找第一个完整的JSON对象
          const arrayEnd = buffer.indexOf(']')
          if (arrayEnd !== -1) {
            const arrayStr = buffer.substring(0, arrayEnd + 1)
            const array = JSON.parse(arrayStr)
            if (Array.isArray(array) && array.length > 0) {
              const text = array[0]?.candidates?.[0]?.content?.parts?.[0]?.text
              if (text) {
                firstDataTime = Date.now()
                console.log(`✅ First data extracted: ${firstDataTime - streamStart}ms`)
                console.log(`   Text: "${text.substring(0, 50)}..."`)
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
    console.log('=' .repeat(60))
    console.log('📊 Performance Summary:')
    console.log('=' .repeat(60))
    console.log(`Total time: ${totalTime}ms (${(totalTime/1000).toFixed(2)}s)`)
    console.log(`Request time: ${requestEnd - requestStart}ms`)
    if (firstChunkTime) {
      console.log(`TTFB (Time to First Byte): ${firstChunkTime - streamStart}ms`)
    }
    if (firstDataTime) {
      console.log(`Time to first data: ${firstDataTime - streamStart}ms`)
    }
    console.log(`Total chunks: ${chunkCount}`)
    console.log(`Total bytes: ${totalBytes}`)
    console.log()

    // 性能评估
    if (totalTime > 5000) {
      console.log('⚠️  Performance Warning:')
      if (requestEnd - requestStart > 2000) {
        console.log('   - High request latency (network/proxy issue)')
      }
      if (firstChunkTime && firstChunkTime - streamStart > 2000) {
        console.log('   - High TTFB (network/proxy issue)')
      }
      if (PROXY_URL) {
        console.log('   - Consider testing without proxy or using a faster proxy')
      }
    } else {
      console.log('✅ Performance is good!')
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack')
  }
}

testPerformance().catch(console.error)

