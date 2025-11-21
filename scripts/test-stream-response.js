/**
 * 测试 Gemini API 流式响应格式
 * 用于诊断流式响应解析问题
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

async function testStreamResponse() {
  console.log('🧪 Testing Gemini API Stream Response Format')
  console.log('=' .repeat(60))
  console.log('Model:', MODEL)
  console.log('Proxy:', PROXY_URL || 'None (direct connection)')
  console.log('=' .repeat(60))
  console.log()

  try {
    const proxyAgent = PROXY_URL ? new ProxyAgent(PROXY_URL) : undefined
    
    const fetchOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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

    console.log('📤 Sending request to:', API_URL.replace(/key=[^&]+/, 'key=***'))
    console.log()

    const response = await fetch(API_URL, fetchOptions)

    console.log('📥 Response Status:', response.status)
    console.log('📥 Content-Type:', response.headers.get('content-type'))
    console.log('📥 Transfer-Encoding:', response.headers.get('transfer-encoding'))
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

    console.log('📊 Analyzing stream format...')
    console.log('=' .repeat(60))
    console.log()

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let chunkCount = 0
    let lineCount = 0
    let jsonCount = 0
    let textCount = 0

    while (true) {
      const { done, value } = await reader.read()
      
      if (done) {
        console.log()
        console.log('=' .repeat(60))
        console.log('📊 Summary:')
        console.log('  Total chunks:', chunkCount)
        console.log('  Total lines:', lineCount)
        console.log('  Valid JSON objects:', jsonCount)
        console.log('  Objects with text:', textCount)
        console.log('  Final buffer length:', buffer.length)
        break
      }

      chunkCount++
      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk

      // 显示第一个chunk的详细信息
      if (chunkCount === 1) {
        console.log('🔍 First Chunk Analysis:')
        console.log('  Length:', chunk.length, 'bytes')
        console.log('  Contains newline:', chunk.includes('\n'))
        console.log('  First 200 chars:', chunk.substring(0, 200))
        console.log('  Hex dump (first 50 bytes):', 
          Array.from(chunk.substring(0, 50).split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))).join(' '))
        console.log()
      }

      // 处理完整的行
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        lineCount++
        const trimmed = line.trim()
        
        if (!trimmed) continue

        // 检查是否是JSON
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          try {
            const json = JSON.parse(trimmed)
            jsonCount++
            
            // 尝试提取文本
            const candidates = json?.candidates || []
            let hasText = false
            
            for (const candidate of candidates) {
              if (candidate?.content?.parts) {
                for (const part of candidate.content.parts) {
                  if (part?.text) {
                    hasText = true
                    textCount++
                    if (textCount <= 3) {
                      console.log(`✅ JSON Object #${jsonCount} (with text):`)
                      console.log('  Text:', part.text.substring(0, 100))
                      console.log('  Full structure:', JSON.stringify(json).substring(0, 300))
                      console.log()
                    }
                    break
                  }
                }
              }
              
              if (candidate?.delta?.content?.parts) {
                for (const part of candidate.delta.content.parts) {
                  if (part?.text) {
                    hasText = true
                    textCount++
                    if (textCount <= 3) {
                      console.log(`✅ JSON Object #${jsonCount} (with delta text):`)
                      console.log('  Text:', part.text.substring(0, 100))
                      console.log('  Full structure:', JSON.stringify(json).substring(0, 300))
                      console.log()
                    }
                    break
                  }
                }
              }
            }
            
            if (!hasText && jsonCount <= 5) {
              console.log(`ℹ️  JSON Object #${jsonCount} (no text):`)
              console.log('  Structure:', JSON.stringify(json).substring(0, 300))
              console.log()
            }
          } catch (e) {
            console.log(`❌ Invalid JSON on line ${lineCount}:`)
            console.log('  Content:', trimmed.substring(0, 200))
            console.log('  Error:', e instanceof Error ? e.message : String(e))
            console.log()
          }
        } else {
          if (lineCount <= 5) {
            console.log(`⚠️  Non-JSON line #${lineCount}:`)
            console.log('  Content:', trimmed.substring(0, 100))
            console.log()
          }
        }
      }
    }

    // 处理剩余的buffer
    if (buffer.trim()) {
      console.log('📝 Remaining buffer:')
      console.log('  Length:', buffer.length)
      console.log('  Content:', buffer.substring(0, 500))
      console.log()
      
      try {
        const json = JSON.parse(buffer.trim())
        console.log('✅ Remaining buffer is valid JSON')
        console.log('  Structure:', JSON.stringify(json).substring(0, 300))
      } catch (e) {
        console.log('❌ Remaining buffer is not valid JSON')
        console.log('  Error:', e instanceof Error ? e.message : String(e))
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack')
  }
}

testStreamResponse().catch(console.error)

