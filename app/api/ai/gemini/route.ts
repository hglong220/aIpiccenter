import { NextResponse } from 'next/server'
import { fetch, ProxyAgent, Agent } from 'undici'
import { formatProxyError, getProxyUrl, getProxyAgentSync } from '@/lib/proxy'
import { handleAPIError, logError } from '@/lib/error-handler'
import { enhancePromptWithSearch } from '@/lib/search-integration'

// 模型配置：默认使用最快的轻量模型（gemini-2.5-flash）
// 性能对比：
// - gemini-2.5-flash: 最快，适合普通聊天（1-2秒响应）
// - gemini-2.5-pro: 较慢，适合复杂任务（3-5秒响应）
// - gemini-ultra: 最慢，适合高难度任务（5-10秒响应）
const GOOGLE_GEMINI_MODEL = process.env.GOOGLE_GEMINI_MODEL ?? 'gemini-2.5-flash'
const GOOGLE_GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GOOGLE_GEMINI_MODEL}:generateContent`
const GOOGLE_GEMINI_STREAM_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GOOGLE_GEMINI_MODEL}:streamGenerateContent`
const RAPIDAPI_ENDPOINT = 'https://gemini-pro-ai.p.rapidapi.com/'

/**
 * 根据任务类型智能选择模型
 * @param taskType 任务类型：'chat' | 'analysis' | 'complex'
 * @returns 模型名称
 */
function selectModelByTask(taskType: 'chat' | 'analysis' | 'complex' = 'chat'): string {
  // 如果环境变量指定了模型，优先使用
  if (process.env.GOOGLE_GEMINI_MODEL) {
    return process.env.GOOGLE_GEMINI_MODEL
  }
  
  // 根据任务类型选择最优模型
  switch (taskType) {
    case 'chat':
      // 普通聊天：使用最快的轻量模型
      return 'gemini-2.5-flash'
    case 'analysis':
      // 分析任务：使用平衡模型
      return 'gemini-2.5-pro'
    case 'complex':
      // 复杂任务：使用最强模型
      return 'gemini-2.5-pro'
    default:
      return 'gemini-2.5-flash'
  }
}

// 获取代理配置（使用安全版本，失败时返回 undefined 允许回退到直连）
function getProxyAgent(): ProxyAgent | undefined {
  const agent = getProxyAgentSync()
  if (agent) {
    const proxyUrl = getProxyUrl()
    console.info('[Gemini] Proxy agent created successfully:', proxyUrl)
  } else {
    const proxyUrl = getProxyUrl()
    if (proxyUrl) {
      console.warn('[Gemini] Proxy agent creation failed, will attempt direct connection')
    }
  }
  return agent
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
        'Connection': 'keep-alive',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        // 性能优化配置
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
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

    const data = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
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
    const proxyUrl = getProxyUrl()
    
    console.error('[Gemini] Request failed:', error instanceof Error ? error.message : String(error))
    console.error('[Gemini] Proxy URL:', proxyUrl || '未配置')
    console.error('[Gemini] Error details:', error)
    
    if (error instanceof Error && error.name === 'AbortError') {
      const { message, diagnostics } = formatProxyError(error, proxyUrl)
      return {
        ok: false as const,
        status: 504,
        error: `请求超时（60秒）。${message}${diagnostics}`,
      }
    }
    
    // 使用统一的错误格式化函数
    const { message, diagnostics } = formatProxyError(error, proxyUrl)
    
    // 添加快速修复建议
    const quickFix = proxyUrl ? `
    
💡 快速修复建议：
- 如果代理持续失败，可以临时禁用代理：
  1. 编辑 .env.local 文件
  2. 注释掉代理配置: # GEMINI_PROXY_URL=${proxyUrl}
  3. 重启开发服务器
- 或运行自动修复脚本: node scripts/auto-fix-proxy.js` : ''
    
    return {
      ok: false as const,
      status: 503,
      error: message + diagnostics + quickFix,
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
        'Connection': 'keep-alive',
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

    const data = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
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
async function callGoogleGeminiStream(
  prompt: string, 
  history?: Array<{ role: string; parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> }>, 
  taskType?: 'chat' | 'analysis' | 'complex',
  images?: Array<{ mimeType: string; base64: string }>
) {
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    console.warn('[Gemini] GOOGLE_GEMINI_API_KEY not configured')
    return null
  }

  try {
    const proxyAgent = getProxyAgent()
    // 智能选择模型（如果未指定，默认使用环境变量或最快的模型）
    const model = taskType ? selectModelByTask(taskType) : GOOGLE_GEMINI_MODEL
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`
    
    // 限制历史消息长度，避免请求体过大（保留最近10条消息）
    const limitedHistory = history && history.length > 10 
      ? history.slice(-10) 
      : history

    // 构建消息内容数组
    const contents: Array<{ role?: string; parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> }> = []
    
    // 如果有历史消息，先添加历史消息
    if (limitedHistory && limitedHistory.length > 0) {
      // 将历史消息转换为 Gemini 格式
      limitedHistory.forEach((msg) => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: msg.parts,
        })
      })
    }
    
    // 始终添加当前提示（修复bug：之前有历史消息时没有添加当前prompt）
    // 构建当前消息的parts数组，包含文本和图片
    const currentParts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = []
    
    // 如果有文本，添加文本部分
    if (prompt.trim()) {
      currentParts.push({ text: prompt })
    }
    
    // 如果有图片，添加图片部分
    if (images && images.length > 0) {
      images.forEach((image) => {
        currentParts.push({
          inline_data: {
            mime_type: image.mimeType,
            data: image.base64,
          },
        })
      })
    }
    
    // 只有当有内容时才添加消息
    if (currentParts.length > 0) {
      contents.push({
        role: 'user',
        parts: currentParts,
      })
    }

    // 性能优化配置：使用最低延迟参数（优先速度）
    const generationConfig = {
      // 降低temperature以加快响应速度（0.7最快，但可能降低质量）
      temperature: 0.7,
      // 限制topK以加快采样速度（更低 = 更快）
      topK: 20,
      // 使用topP以平衡速度和质量（更低 = 更快）
      topP: 0.9,
      // 限制最大输出token数，避免过长响应（更短 = 更快）
      maxOutputTokens: 1024,
    }

    const fetchOptions: {
      method: string
      headers: Record<string, string>
      body: string
      signal?: AbortSignal
      dispatcher?: ProxyAgent
    } = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 启用HTTP Keep-alive以减少连接开销
        'Connection': 'keep-alive',
      },
      body: JSON.stringify({
        contents,
        generationConfig,
      }),
    }

    if (proxyAgent) {
      fetchOptions.dispatcher = proxyAgent
    }

    // 添加超时控制（30秒超时）
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)
    fetchOptions.signal = controller.signal

    const response = await fetch(apiUrl, fetchOptions)
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorPayload = await response.text()
      return {
        ok: false as const,
        status: response.status,
        error: errorPayload || 'Google Gemini API request failed.',
      }
    }

    if (!response.body) {
      return {
        ok: false as const,
        status: 500,
        error: 'Stream response has no body',
      }
    }

    return {
      ok: true as const,
      stream: response.body,
    }
  } catch (error) {
    const proxyUrl = getProxyUrl()
    
    console.error('[Gemini] Stream request failed:', error instanceof Error ? error.message : String(error))
    console.error('[Gemini] Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('[Gemini] Proxy URL:', proxyUrl || '未配置')
    
    // 使用统一的错误格式化函数
    const { message, diagnostics } = formatProxyError(error, proxyUrl)
    
    // 添加快速修复建议
    const quickFix = proxyUrl ? `
    
💡 快速修复建议：
- 如果代理持续失败，可以临时禁用代理：
  1. 编辑 .env.local 文件
  2. 注释掉代理配置: # GEMINI_PROXY_URL=${proxyUrl}
  3. 重启开发服务器
- 或运行自动修复脚本: node scripts/auto-fix-proxy.js` : ''
    
    return {
      ok: false as const,
      status: 503,
      error: message + diagnostics + quickFix,
    }
  }
}

export async function POST(request: Request) {
  // 在函数作用域提前声明，供 catch 使用
  let hasImages = false
  let prompt = ''

  try {
    const body = await request.json().catch(() => null)

    // 验证：必须有提示词或图片
    const images = body.images as Array<{ mimeType: string; base64: string }> | undefined // 图片数组
    hasImages = !!(images && images.length > 0)
    const hasPrompt = body.prompt && typeof body.prompt === 'string' && body.prompt.trim()
    
    if (!hasPrompt && !hasImages) {
      return NextResponse.json({ error: '请输入提示词或上传文件。' }, { status: 400 })
    }

    prompt = (body.prompt && typeof body.prompt === 'string' ? body.prompt.trim() : '') || ''
    const history = body.history // 历史消息数组
    const useStream = body.stream !== false // 默认使用流式，除非明确指定 stream: false
    const taskType = body.taskType as 'chat' | 'analysis' | 'complex' | undefined // 任务类型
    const enableSearch = body.enableSearch !== false // 是否启用搜索（默认true）
    
    // 如果启用搜索且有提示词，尝试增强
    let searchSources: any[] = []
    if (enableSearch && prompt && !hasImages) {
      try {
        const { enhancedPrompt, sources, searchPerformed } = await enhancePromptWithSearch(prompt)
        if (searchPerformed && sources.length > 0) {
          prompt = enhancedPrompt
          searchSources = sources
          console.log('[Gemini] Enhanced prompt with search results:', sources.length, 'sources')
        }
      } catch (error) {
        logError('Search Enhancement', error)
        // 搜索失败不影响正常流程
      }
    }

    // 如果请求流式响应
    if (useStream) {
      // 立即开始流式请求，不等待完整响应
      const streamResult = await callGoogleGeminiStream(prompt, history, taskType, images)
      
      if (streamResult && streamResult.ok && streamResult.stream) {
        // 立即创建流式响应，优化TTFB（Time to First Byte）
        // 不等待任何数据处理，直接开始流式传输
        // 辅助函数：从响应对象中提取文本
        const extractTextFromResponse = (response: any): string => {
          try {
            // Gemini API 流式响应格式可能有多种：
            // 1. { candidates: [{ content: { parts: [{ text: "..." }] } }] }
            // 2. { candidates: [{ delta: { content: { parts: [{ text: "..." }] } } }] }  // 增量更新格式
            
            let text = ''
            
            // 尝试标准格式
            const candidates = response?.candidates || []
            for (const candidate of candidates) {
              // 检查是否有 finishReason
              if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
                // 继续处理，finishReason 只是标记
              }
              
              // 标准格式：candidate.content.parts
              if (candidate?.content?.parts) {
                const parts = candidate.content.parts
                for (const part of parts) {
                  if (part?.text) {
                    text += part.text
                  }
                }
              }
              
              // 增量格式：candidate.delta.content.parts
              if (candidate?.delta?.content?.parts) {
                const parts = candidate.delta.content.parts
              for (const part of parts) {
                if (part?.text) {
                  text += part.text
                }
              }
            }
            }
            
            // 如果没有找到文本，记录响应结构以便调试
            if (!text && response) {
              console.log('[Gemini] No text found in response. Structure:', JSON.stringify(response).substring(0, 300))
            }
            
            return text
          } catch (e) {
            console.warn('[Gemini] Error extracting text from response:', e, 'Response:', JSON.stringify(response).substring(0, 200))
            return ''
          }
        }
        
        // 创建优化的流式响应，最小化TTFB
        const stream = new ReadableStream({
          async start(controller) {
            const reader = streamResult.stream!.getReader()
            const decoder = new TextDecoder()
            const encoder = new TextEncoder()

            try {
              let buffer = ''
              let hasSentData = false
              const startTime = Date.now()
              
              // 实时解析和发送每个chunk，优化性能
              while (true) {
                const { done, value } = await reader.read()
                
                if (done) {
                  // 处理剩余的buffer
                  if (buffer.trim()) {
                    const lines = buffer.split('\n').filter(line => line.trim())
                    for (const line of lines) {
                      if (!line.startsWith('{') && !line.startsWith('[')) continue
                      try {
                        const response = JSON.parse(line.trim())
                        const text = extractTextFromResponse(response)
                        if (text) {
                          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
                          hasSentData = true
                        }
                      } catch (e) {
                        // 忽略解析错误
                      }
                    }
                  }
                  
                  if (!hasSentData) {
                    console.warn('[Gemini] Stream ended without data')
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: '', error: 'No response received' })}\n\n`))
                  }
                  
                  controller.close()
                  break
                }

                buffer += decoder.decode(value, { stream: true })
                
                // 按行处理（NDJSON格式）
                const lines = buffer.split('\n')
                buffer = lines.pop() || '' // 保留最后一行（可能不完整）
                
                for (const line of lines) {
                  const trimmedLine = line.trim()
                  if (!trimmedLine || (!trimmedLine.startsWith('{') && !trimmedLine.startsWith('['))) {
                    continue
                  }
                  
                  try {
                    const response = JSON.parse(trimmedLine)
                    const text = extractTextFromResponse(response)
                    
                    if (text) {
                      if (!hasSentData) {
                        const ttfb = Date.now() - startTime
                        console.log('[Gemini] TTFB:', ttfb, 'ms')
                        hasSentData = true
                      }
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
                    }
                  } catch (e) {
                    // 如果解析失败，可能是不完整的JSON，加回buffer
                    if (lines.indexOf(line) === lines.length - 1) {
                      buffer = line + '\n' + buffer
                    }
                  }
                }
              }
            } catch (error) {
              console.error('[Gemini] Stream processing error:', error)
              // 发送错误信息给客户端
              try {
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text: '', error: error instanceof Error ? error.message : 'Stream processing error' })}\n\n`))
              } catch (e) {
                // 如果无法发送错误，直接关闭
              }
              controller.error(error)
            } finally {
              reader.releaseLock()
            }
          },
        })

        // 优化TTFB：立即返回响应，不等待任何处理
        // 使用流式传输，边接收边发送，最大化响应速度
        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no', // 禁用Nginx缓冲（如果使用Nginx）
            'Transfer-Encoding': 'chunked', // 明确指定分块传输
          },
        })
      }

      // 流式调用失败，回退到非流式
      // (静默失败，直接回退到非流式)
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
    logError('Gemini API', error, { hasImages, hasPrompt: !!prompt })
    const errorResponse = handleAPIError(error)
    return NextResponse.json(
      { 
        error: errorResponse.error,
        suggestion: errorResponse.suggestion,
        retryable: errorResponse.retryable
      }, 
      { status: errorResponse.code }
    )
  }
}
