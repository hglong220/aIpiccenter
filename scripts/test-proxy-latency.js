/**
 * 测试代理延迟
 * 如果延迟 > 500ms，代理可能是瓶颈
 */

const { fetch, ProxyAgent } = require('undici')
require('dotenv').config({ path: '.env.local' })

const PROXY_URL = process.env.GEMINI_PROXY_URL || process.env.HTTPS_PROXY || process.env.HTTP_PROXY

if (!PROXY_URL) {
  console.error('❌ No proxy configured')
  console.error('   Set GEMINI_PROXY_URL, HTTPS_PROXY, or HTTP_PROXY in .env.local')
  process.exit(1)
}

console.log('📡 Testing Proxy Latency')
console.log('='.repeat(60))
console.log('Proxy:', PROXY_URL)
console.log('='.repeat(60))
console.log()

async function testProxyLatency() {
  try {
    const proxyAgent = new ProxyAgent(PROXY_URL)
    
    // 测试1: 连接到 Google
    console.log('Test 1: Connecting to Google...')
    const start1 = Date.now()
    try {
      const response1 = await fetch('https://www.google.com', {
        dispatcher: proxyAgent,
        signal: AbortSignal.timeout(10000), // 10秒超时
      })
      await response1.text() // 等待完整响应
      const end1 = Date.now()
      const latency1 = end1 - start1
      console.log(`   ✅ Latency: ${latency1}ms`)
      if (latency1 > 1000) {
        console.log(`   ❌ Very high latency! (> 1000ms) Proxy is likely the main bottleneck.`)
      } else if (latency1 > 500) {
        console.log(`   ⚠️  High latency! (> 500ms) This may be the main bottleneck.`)
      } else {
        console.log(`   ✅ Latency is acceptable (< 500ms)`)
      }
    } catch (e) {
      console.log(`   ❌ Failed: ${e.message}`)
    }
    console.log()

    // 测试2: 连接到 Gemini API 端点
    console.log('Test 2: Connecting to Gemini API endpoint...')
    const start2 = Date.now()
    try {
      const response2 = await fetch('https://generativelanguage.googleapis.com', {
        dispatcher: proxyAgent,
        signal: AbortSignal.timeout(10000), // 10秒超时
      })
      await response2.text()
      const end2 = Date.now()
      const latency2 = end2 - start2
      console.log(`   ✅ Latency: ${latency2}ms`)
      if (latency2 > 1000) {
        console.log(`   ❌ Very high latency! (> 1000ms) Proxy is likely the main bottleneck.`)
      } else if (latency2 > 500) {
        console.log(`   ⚠️  High latency! (> 500ms) This may be the main bottleneck.`)
      } else {
        console.log(`   ✅ Latency is acceptable (< 500ms)`)
      }
    } catch (e) {
      console.log(`   ❌ Failed: ${e.message}`)
    }
    console.log()

    // 测试3: 多次测试取平均值
    console.log('Test 3: Multiple tests (averaging)...')
    const latencies = []
    for (let i = 0; i < 3; i++) {
      try {
        const start = Date.now()
        const response = await fetch('https://www.google.com', {
          dispatcher: proxyAgent,
          signal: AbortSignal.timeout(10000),
        })
        await response.text()
        const end = Date.now()
        const latency = end - start
        latencies.push(latency)
        console.log(`   Test ${i + 1}: ${latency}ms`)
      } catch (e) {
        console.log(`   Test ${i + 1}: Failed (${e.message})`)
      }
    }
    
    if (latencies.length > 0) {
      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length
      const minLatency = Math.min(...latencies)
      const maxLatency = Math.max(...latencies)
      
      console.log()
      console.log('─'.repeat(60))
      console.log('📊 Summary:')
      console.log('─'.repeat(60))
      console.log(`Average latency: ${avgLatency.toFixed(0)}ms`)
      console.log(`Min latency: ${minLatency}ms`)
      console.log(`Max latency: ${maxLatency}ms`)
      console.log()
      
      if (avgLatency > 1000) {
        console.log('❌ Average latency is VERY HIGH (> 1000ms)')
        console.log('   💡 Proxy is likely the main bottleneck')
        console.log('   💡 Recommendations:')
        console.log('      - Use a faster proxy server')
        console.log('      - Use a proxy closer to your location')
        console.log('      - Consider using a paid proxy service')
      } else if (avgLatency > 500) {
        console.log('⚠️  Average latency is HIGH (> 500ms)')
        console.log('   💡 Proxy may be contributing to delays')
        console.log('   💡 Consider optimizing proxy or using a faster one')
      } else {
        console.log('✅ Average latency is ACCEPTABLE (< 500ms)')
        console.log('   💡 Proxy latency is not the main bottleneck')
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('   Error details:', error.stack || error)
  }
}

testProxyLatency().catch(console.error)

