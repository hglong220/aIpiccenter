import { NextResponse } from 'next/server'
import { fetch, ProxyAgent, Agent } from 'undici'

const GOOGLE_GEMINI_MODEL = process.env.GOOGLE_GEMINI_MODEL ?? 'gemini-2.5-flash'
const GOOGLE_GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GOOGLE_GEMINI_MODEL}:generateContent`
const GOOGLE_GEMINI_STREAM_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GOOGLE_GEMINI_MODEL}:streamGenerateContent`
const RAPIDAPI_ENDPOINT = 'https://gemini-pro-ai.p.rapidapi.com/'

// 获取代理配置
function getProxyAgent(): ProxyAgent | undefined {
  const proxyUrl =
    process.env.GEMINI_PROXY_URL ||
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    null

  if (!proxyUrl) {
    console.warn('[Gemini] No proxy URL found in environment variables')
    return undefined
  }

  try {
    const agent = new ProxyAgent(proxyUrl)
    console.info('[Gemini] Proxy agent created successfully:', proxyUrl)
    return agent
  } catch (error) {
    console.error('[Gemini] Failed to create proxy agent:', error)
    return undefined
  }
}

async function callGoogleGemini(prompt: string) {
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    console.warn('[Gemini] GOOGLE_GEMINI_API_KEY not configured')
    return null
  }

  // 检查代理配置
  const proxyUrl = process.env.GEMINI_PROXY_URL || process.env.HTTPS_PROXY || process.env.HTTP_PROXY
  if (!proxyUrl) {
    console.warn('[Gemini] No proxy configured. Requests may fail if network is blocked.')
  }

  try {
    // 创建带超时的 AbortController（60秒超时）
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)

    // 获取代理配置（如果需要绕过墙）
    const proxyAgent = getProxyAgent()
    
    // 构建请求选项
    const fetchOptions: {
      method: string
      headers: Record<string, string>
      body: string
      signal: AbortSignal
      dispatcher?: ProxyAgent
    } = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
      signal: controller.signal,
    }

    // 如果配置了代理，设置 dispatcher
    if (proxyAgent) {
      fetchOptions.dispatcher = proxyAgent
      console.info('[Gemini] Using proxy for Google API request')
      console.info('[Gemini] Proxy URL:', process.env.GEMINI_PROXY_URL || process.env.HTTPS_PROXY || process.env.HTTP_PROXY)
      console.info('[Gemini] API Endpoint:', GOOGLE_GEMINI_ENDPOINT)
    } else {
      console.warn('[Gemini] No proxy configured - direct connection may fail')
    }

    // 使用 undici 的 fetch（支持 dispatcher）
    const apiUrl = `${GOOGLE_GEMINI_ENDPOINT}?key=${process.env.GOOGLE_GEMINI_API_KEY}`
    console.info('[Gemini] Making request to:', apiUrl.replace(/key=[^&]+/, 'key=***'))
    const response = await fetch(apiUrl, fetchOptions)

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorPayload = await response.text()
      console.warn('Google Gemini API returned error:', response.status, errorPayload)
      return {
        ok: false as const,
        status: response.status,
        error: errorPayload || 'Google Gemini API request failed.',
      }
    }

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || '')
      .join('\n')
      .trim()

    return {
      ok: true as const,
      payload: data,
      text,
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[Gemini] Request timeout (60s)')
      const proxyUrl = process.env.GEMINI_PROXY_URL || process.env.HTTPS_PROXY || process.env.HTTP_PROXY || 'Not configured'
      return {
        ok: false as const,
        status: 504,
        error: `请求超时（60秒）。当前代理配置: ${proxyUrl}。请检查代理服务器是否正常运行。`,
      }
    } else {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const proxyUrl = process.env.GEMINI_PROXY_URL || process.env.HTTPS_PROXY || process.env.HTTP_PROXY || 'Not configured'
      console.error('[Gemini] Request failed:', errorMessage)
      console.error('[Gemini] Proxy URL:', proxyUrl)
      console.error('[Gemini] Error details:', error)
      return {
        ok: false as const,
        status: 503,
        error: `网络连接失败: ${errorMessage}。当前代理配置: ${proxyUrl}。请确认代理地址是否正确，代理服务器是否运行正常。`,
      }
    }
  }
}

async function callRapidGemini(prompt: string) {
  if (!process.env.RAPIDAPI_GEMINI_KEY || !process.env.RAPIDAPI_GEMINI_HOST) {
    return null
  }

  try {
    // 创建带超时的 AbortController（60秒超时）
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)

    const response = await fetch(RAPIDAPI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': process.env.RAPIDAPI_GEMINI_HOST,
        'x-rapidapi-key': process.env.RAPIDAPI_GEMINI_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorPayload = await response.text()
      return {
        ok: false as const,
        status: response.status,
        error: errorPayload || 'RapidAPI Gemini request failed.',
      }
    }

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || '')
      .join('\n')
      .trim()

    return {
      ok: true as const,
      payload: data,
      text,
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('RapidAPI Gemini request timeout (60s)')
      return {
        ok: false as const,
        status: 504,
        error: '请求超时，请检查网络连接或稍后再试。',
      }
    }
    console.error('RapidAPI Gemini request error:', error)
    return {
      ok: false as const,
      status: 503,
      error: 'RapidAPI 服务暂时不可用，请稍后再试。',
    }
  }
}

  // 流式调用 Google Gemini API
async function callGoogleGeminiStream(prompt: string) {
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    console.warn('[Gemini] GOOGLE_GEMINI_API_KEY not configured')
    return null
  }

  try {
    const proxyAgent = getProxyAgent()
    const apiUrl = `${GOOGLE_GEMINI_STREAM_ENDPOINT}?key=${process.env.GOOGLE_GEMINI_API_KEY}`
    
    console.log('[Gemini] Stream API URL:', apiUrl.replace(/key=[^&]+/, 'key=***'))
    console.log('[Gemini] Request prompt length:', prompt.length)

    const fetchOptions: {
      method: string
      headers: Record<string, string>
      body: string
      dispatcher?: ProxyAgent
    } = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    }

    if (proxyAgent) {
      fetchOptions.dispatcher = proxyAgent
      console.log('[Gemini] Using proxy for stream request')
    } else {
      console.warn('[Gemini] No proxy configured for stream request')
    }

    console.log('[Gemini] Sending stream request...')
    const response = await fetch(apiUrl, fetchOptions)
    console.log('[Gemini] Stream response status:', response.status)
    console.log('[Gemini] Stream response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorPayload = await response.text()
      console.warn('Google Gemini Stream API returned error:', response.status, errorPayload)
      return {
        ok: false as const,
        status: response.status,
        error: errorPayload || 'Google Gemini API request failed.',
      }
    }

    if (!response.body) {
      console.error('[Gemini] Stream response has no body')
      return {
        ok: false as const,
        status: 500,
        error: 'Stream response has no body',
      }
    }

    console.log('[Gemini] Stream response body received')
    return {
      ok: true as const,
      stream: response.body,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[Gemini] Stream request failed:', errorMessage)
    console.error('[Gemini] Error stack:', error instanceof Error ? error.stack : 'No stack')
    return {
      ok: false as const,
      status: 503,
      error: `网络连接失败: ${errorMessage}`,
    }
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)

    if (!body || typeof body.prompt !== 'string' || !body.prompt.trim()) {
      return NextResponse.json({ error: '请输入提示词。' }, { status: 400 })
    }

    const prompt = body.prompt.trim()
    const useStream = body.stream !== false // 默认使用流式，除非明确指定 stream: false

    // 如果请求流式响应
    if (useStream) {
      console.log('[Gemini] Attempting stream request...')
      const streamResult = await callGoogleGeminiStream(prompt)
      
      if (streamResult && streamResult.ok && streamResult.stream) {
        console.log('[Gemini] Stream response received, creating ReadableStream...')
        // 创建流式响应
        const stream = new ReadableStream({
          async start(controller) {
            const reader = streamResult.stream!.getReader()
            const decoder = new TextDecoder()

            try {
              let chunkCount = 0
              let fullResponse = ''
              
              // 累积所有数据块，等待完整响应
              while (true) {
                const { done, value } = await reader.read()
                
                if (done) {
                  console.log('[Gemini] Stream reading done, full response length:', fullResponse.length)
                  
                  // 解析完整的JSON响应
                  if (fullResponse.trim()) {
                    try {
                      const trimmedResponse = fullResponse.trim()
                      console.log('[Gemini] Parsing full JSON response, length:', trimmedResponse.length)
                      console.log('[Gemini] Response preview:', trimmedResponse.substring(0, 200))
                      
                      // Gemini streamGenerateContent 返回的是 JSON 数组
                      const responseArray = JSON.parse(trimmedResponse)
                      
                      // 确保是数组格式
                      const responses = Array.isArray(responseArray) ? responseArray : [responseArray]
                      console.log('[Gemini] Parsed response array, length:', responses.length)
                      
                      // 遍历所有响应对象，提取文本内容
                      let totalText = ''
                      for (const response of responses) {
                        const candidates = response?.candidates || []
                        console.log('[Gemini] Response has', candidates.length, 'candidates')
                        
                        for (const candidate of candidates) {
                          const parts = candidate?.content?.parts || []
                          for (const part of parts) {
                            const text = part?.text || ''
                            if (text) {
                              totalText += text
                            }
                          }
                        }
                      }
                      
                      if (totalText) {
                        console.log('[Gemini] Extracted total text length:', totalText.length)
                        console.log('[Gemini] Text preview:', totalText.substring(0, 100))
                        
                        // 将完整文本分块发送，模拟流式效果
                        const chunkSize = 20 // 每次发送20个字符
                        for (let i = 0; i < totalText.length; i += chunkSize) {
                          const chunk = totalText.slice(i, i + chunkSize)
                          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text: chunk })}\n\n`))
                        }
                      } else {
                        console.warn('[Gemini] No text extracted from response')
                        console.warn('[Gemini] Full response structure:', JSON.stringify(responses, null, 2).substring(0, 1000))
                      }
                    } catch (e) {
                      console.error('[Gemini] Failed to parse full response:', e)
                      console.error('[Gemini] Parse error:', e instanceof Error ? e.message : String(e))
                      console.error('[Gemini] Response content (first 1000 chars):', fullResponse.substring(0, 1000))
                    }
                  }
                  
                  console.log('[Gemini] Stream closed, total chunks processed:', chunkCount)
                  controller.close()
                  break
                }

                chunkCount++
                console.log(`[Gemini] Reading chunk ${chunkCount}, value length:`, value?.length || 0)
                
                // 累积所有数据块（不解码为文本，因为可能是gzip压缩的）
                // undici fetch 应该已经自动处理了 gzip 解压
                const decodedChunk = decoder.decode(value, { stream: true })
                fullResponse += decodedChunk
                console.log('[Gemini] Accumulated response length:', fullResponse.length)
              }
            } catch (error) {
              console.error('[Gemini] Stream reading error:', error)
              controller.error(error)
            } finally {
              reader.releaseLock()
            }
          },
        })

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        })
      }

      // 流式调用失败，回退到非流式
      if (streamResult && !streamResult.ok) {
        console.warn('[Gemini] Stream failed, falling back to non-stream:', streamResult.error)
      } else if (!streamResult || !streamResult.ok) {
        console.warn('[Gemini] Stream not available, falling back to non-stream')
      }
    }

    // 非流式调用（回退方案）
    const googleResult = await callGoogleGemini(prompt)
    if (googleResult && googleResult.ok) {
      return NextResponse.json({
        text: googleResult.text,
        raw: googleResult.payload,
        source: 'google',
      })
    }

    // Google API 失败，返回错误
    if (googleResult === null) {
      return NextResponse.json(
        {
          error: '未配置 Google Gemini API 密钥。请在环境变量中设置 GOOGLE_GEMINI_API_KEY。',
        },
        { status: 500 },
      )
    }

    // Google API 调用失败
    return NextResponse.json(
      {
        error: googleResult.error || 'Google Gemini API 调用失败。请检查网络连接和代理配置。',
      },
      { status: googleResult.status || 503 },
    )
  } catch (error) {
    console.error('Gemini API proxy error:', error)
    return NextResponse.json({ error: '服务器异常，请稍后再试。' }, { status: 500 })
  }
}
