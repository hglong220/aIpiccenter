import { NextResponse } from 'next/server'
import { fetch, ProxyAgent, Agent } from 'undici'

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
    const errorMessage = error instanceof Error ? error.message : String(error)
    const proxyUrl = process.env.GEMINI_PROXY_URL || process.env.HTTPS_PROXY || process.env.HTTP_PROXY || '未配置'
    
    console.error('[Gemini] Request failed:', errorMessage)
    console.error('[Gemini] Proxy URL:', proxyUrl)
    console.error('[Gemini] Error details:', error)
    
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        ok: false as const,
        status: 504,
        error: `请求超时（60秒）。当前代理配置: ${proxyUrl}。请检查代理服务器是否正常运行。`,
      }
    }
    
    // 提供更详细的错误信息和诊断建议
    let detailedError = `网络连接失败: ${errorMessage}`
    let diagnosticSteps = ''
    
    if (errorMessage.includes('fetch failed') || errorMessage.includes('ECONNREFUSED')) {
      detailedError = `代理连接失败: 无法连接到代理服务器 ${proxyUrl}`
      diagnosticSteps = `
诊断步骤：
1. 检查代理服务器是否运行正常
   - 运行测试脚本: node scripts/test-current-proxy.js
   - 或使用 curl 测试: curl -x ${proxyUrl} https://www.google.com

2. 验证代理地址和端口是否正确
   - 当前配置: ${proxyUrl}
   - 检查 .env.local 文件中的 GEMINI_PROXY_URL、HTTPS_PROXY 或 HTTP_PROXY

3. 检查网络连接
   - 确认可以访问代理服务器 IP: ${proxyUrl.split('://')[1]?.split(':')[0] || 'N/A'}
   - 检查防火墙是否阻止了连接

4. 如果代理需要认证
   - 使用格式: http://username:password@host:port
   - 示例: http://user:pass@47.79.137.153:3128

5. 尝试不使用代理（如果网络允许）
   - 临时删除或注释掉 .env.local 中的代理配置
   - 重启开发服务器`
    } else if (errorMessage.includes('ECONNRESET') || errorMessage.includes('connection closed')) {
      detailedError = `代理连接中断: 代理服务器 ${proxyUrl} 在传输过程中关闭了连接`
      diagnosticSteps = `
可能原因：
1. 代理服务器需要认证（用户名/密码）
2. 代理服务器配置限制了来源 IP
3. SSL/TLS 握手失败
4. 代理服务器负载过高或已关闭

解决方案：
- 如果代理需要认证，添加用户名和密码到代理 URL
- 检查代理服务器日志
- 确认你的 IP 地址在代理允许列表中
- 尝试更换代理服务器`
    } else if (errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
      detailedError = `代理连接超时: 代理服务器 ${proxyUrl} 响应超时`
      diagnosticSteps = `
可能原因：
1. 代理服务器响应超时
2. 网络延迟过高
3. 代理服务器负载过高

解决方案：
- 检查网络连接
- 尝试更换代理服务器
- 检查代理服务器状态`
    }
    
    return {
      ok: false as const,
      status: 503,
      error: detailedError + diagnosticSteps,
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
    const errorMessage = error instanceof Error ? error.message : String(error)
    const proxyUrl = process.env.GEMINI_PROXY_URL || process.env.HTTPS_PROXY || process.env.HTTP_PROXY || '未配置'
    
    console.error('[Gemini] Stream request failed:', errorMessage)
    console.error('[Gemini] Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('[Gemini] Proxy URL:', proxyUrl)
    
    // 提供更详细的错误信息和诊断建议
    let detailedError = `网络连接失败: ${errorMessage}`
    let diagnosticSteps = ''
    
    if (errorMessage.includes('fetch failed') || errorMessage.includes('ECONNREFUSED')) {
      detailedError = `代理连接失败: 无法连接到代理服务器 ${proxyUrl}`
      diagnosticSteps = `
诊断步骤：
1. 检查代理服务器是否运行正常
   - 运行测试脚本: node scripts/test-current-proxy.js
   - 或使用 curl 测试: curl -x ${proxyUrl} https://www.google.com

2. 验证代理地址和端口是否正确
   - 当前配置: ${proxyUrl}
   - 检查 .env.local 文件中的 GEMINI_PROXY_URL、HTTPS_PROXY 或 HTTP_PROXY

3. 检查网络连接
   - 确认可以访问代理服务器 IP: ${proxyUrl.split('://')[1]?.split(':')[0] || 'N/A'}
   - 检查防火墙是否阻止了连接

4. 如果代理需要认证
   - 使用格式: http://username:password@host:port
   - 示例: http://user:pass@47.79.137.153:3128

5. 尝试不使用代理（如果网络允许）
   - 临时删除或注释掉 .env.local 中的代理配置
   - 重启开发服务器`
    } else if (errorMessage.includes('ECONNRESET') || errorMessage.includes('connection closed')) {
      detailedError = `代理连接中断: 代理服务器 ${proxyUrl} 在传输过程中关闭了连接`
      diagnosticSteps = `
可能原因：
1. 代理服务器需要认证（用户名/密码）
2. 代理服务器配置限制了来源 IP
3. SSL/TLS 握手失败
4. 代理服务器负载过高或已关闭

解决方案：
- 如果代理需要认证，添加用户名和密码到代理 URL
- 检查代理服务器日志
- 确认你的 IP 地址在代理允许列表中
- 尝试更换代理服务器`
    } else if (errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
      detailedError = `代理连接超时: 代理服务器 ${proxyUrl} 响应超时`
      diagnosticSteps = `
可能原因：
1. 代理服务器响应超时
2. 网络延迟过高
3. 代理服务器负载过高

解决方案：
- 检查网络连接
- 尝试更换代理服务器
- 检查代理服务器状态`
    }
    
    return {
      ok: false as const,
      status: 503,
      error: detailedError + diagnosticSteps,
    }
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)

    // 验证：必须有提示词或图片
    const images = body.images as Array<{ mimeType: string; base64: string }> | undefined // 图片数组
    const hasImages = images && images.length > 0
    const hasPrompt = body.prompt && typeof body.prompt === 'string' && body.prompt.trim()
    
    if (!hasPrompt && !hasImages) {
      return NextResponse.json({ error: '请输入提示词或上传文件。' }, { status: 400 })
    }

    const prompt = (body.prompt && typeof body.prompt === 'string' ? body.prompt.trim() : '') || ''
    const history = body.history // 历史消息数组
    const useStream = body.stream !== false // 默认使用流式，除非明确指定 stream: false
    const taskType = body.taskType as 'chat' | 'analysis' | 'complex' | undefined // 任务类型

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
            // 立即发送一个心跳消息，让客户端知道连接已建立（优化TTFB）
            // 这可以让客户端立即知道服务器已响应，减少感知延迟
            try {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text: '', status: 'connecting' })}\n\n`))
            } catch (e) {
              // 忽略心跳发送错误
            }
            
            const reader = streamResult.stream!.getReader()
            const decoder = new TextDecoder()

            try {
              let buffer = '' // 用于累积不完整的JSON
              let hasSentData = false // 跟踪是否已发送数据
              let chunkCount = 0 // 用于调试
              let firstChunkReceived = false // 跟踪是否收到第一个chunk
              let firstByteTime = Date.now() // 记录首字节时间
              let isArrayFormat = false // 跟踪是否是数组格式
              
              // 实时解析和发送每个chunk，优化性能
              while (true) {
                const { done, value } = await reader.read()
                
                if (done) {
                  // 处理剩余的buffer
                  if (buffer.trim()) {
                    // 尝试解析剩余的buffer（可能是完整的JSON或多行）
                    const trimmedBuffer = buffer.trim()
                    
                    // 尝试按行分割
                    const lines = trimmedBuffer.split('\n').filter(line => line.trim())
                    
                    if (lines.length > 0) {
                      // 有多行，逐行处理
                    for (const line of lines) {
                      try {
                        const response = JSON.parse(line.trim())
                          const text = extractTextFromResponse(response)
                          if (text) {
                            hasSentData = true
                            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`))
                          }
                        } catch (e) {
                          // 忽略单行解析错误
                        }
                      }
                    } else {
                      // 只有一行，尝试直接解析
                      try {
                        const response = JSON.parse(trimmedBuffer)
                        const text = extractTextFromResponse(response)
                        if (text) {
                          hasSentData = true
                          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`))
                        }
                      } catch (e) {
                        // 解析失败，记录错误
                        console.warn('[Gemini] Failed to parse final buffer:', trimmedBuffer.substring(0, 200))
                      }
                    }
                  }
                  
                  // 如果没有发送任何数据，尝试最后解析
                  if (!hasSentData && buffer.trim()) {
                    console.warn('[Gemini] No data extracted, attempting final parse...')
                    console.warn('[Gemini] Buffer length:', buffer.length)
                    console.warn('[Gemini] Format detected:', isArrayFormat ? 'Array' : 'NDJSON')
                    
                    try {
                      const cleanedBuffer = buffer.trim().replace(/[\x00-\x1F\x7F]/g, '')
                      
                      if (isArrayFormat) {
                        // 尝试解析数组
                        const array = JSON.parse(cleanedBuffer)
                        if (Array.isArray(array)) {
                          for (const item of array) {
                            const text = extractTextFromResponse(item)
                            if (text) {
                              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`))
                            }
                          }
                        }
                      } else {
                        // 尝试解析单个JSON对象
                        const response = JSON.parse(cleanedBuffer)
                        const text = extractTextFromResponse(response)
                        if (text) {
                          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`))
                        } else {
                          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text: '', error: 'No text content in response' })}\n\n`))
                        }
                      }
                    } catch (e) {
                      console.error('[Gemini] Final parse failed:', e instanceof Error ? e.message : String(e))
                      console.error('[Gemini] Buffer (first 1000 chars):', buffer.substring(0, 1000))
                      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text: '', error: 'Failed to parse stream response' })}\n\n`))
                    }
                  }
                  
                  controller.close()
                  break
                }

                chunkCount++
                const decodedChunk = decoder.decode(value, { stream: true })
                
                // 记录第一个chunk的内容以便调试
                if (!firstChunkReceived && decodedChunk) {
                  firstChunkReceived = true
                  const ttfb = Date.now() - firstByteTime
                  console.log('[Gemini] First chunk received (TTFB:', ttfb, 'ms)')
                  console.log('[Gemini] First chunk (first 200 chars):', decodedChunk.substring(0, 200))
                  
                  // 检测响应格式：数组格式 `[{...}]` 还是 NDJSON 格式（每行一个JSON）
                  if (decodedChunk.trim().startsWith('[')) {
                    isArrayFormat = true
                    console.log('[Gemini] Detected array format: [{...}]')
                  } else {
                    console.log('[Gemini] Detected NDJSON format (one JSON per line)')
                  }
                }
                
                buffer += decodedChunk
                
                // 根据格式类型处理
                if (isArrayFormat) {
                  // 数组格式：Gemini API 返回的是 `[{...}, {...}]` 格式
                  // 关键优化：尝试增量解析，不等待完整数组
                  // 查找已完成的JSON对象（以 `},` 或 `}]` 结尾），立即处理
                  try {
                    // 策略：查找完整的JSON对象并立即解析
                    // 使用正则表达式查找完整的对象：从 `{` 到 `},` 或 `}]`
                    let searchStart = 0
                    let foundAny = false
                    
                    while (true) {
                      // 查找下一个对象的开始和结束
                      const objStart = buffer.indexOf('{', searchStart)
                      if (objStart === -1) break
                      
                      // 查找对象的结束：`},` 或 `}]`
                      const objEndComma = buffer.indexOf('},', objStart)
                      const objEndBracket = buffer.indexOf('}]', objStart)
                      
                      let objEnd = -1
                      if (objEndComma !== -1 && (objEndBracket === -1 || objEndComma < objEndBracket)) {
                        objEnd = objEndComma + 1 // 包含 `},`
                      } else if (objEndBracket !== -1) {
                        objEnd = objEndBracket + 1 // 包含 `}]`
                      }
                      
                      if (objEnd === -1) {
                        // 对象还不完整，退出循环
                        break
                      }
                      
                      // 提取对象字符串（移除末尾的 `,` 或 `]`）
                      let objStr = buffer.substring(objStart, objEnd)
                      // 移除末尾的 `,` 或 `]`
                      if (objStr.endsWith(',')) {
                        objStr = objStr.slice(0, -1)
                      } else if (objStr.endsWith(']')) {
                        objStr = objStr.slice(0, -1)
                      }
                      
                      try {
                        // 尝试解析单个对象
                        const item = JSON.parse(objStr)
                        const text = extractTextFromResponse(item)
                        
                        if (text) {
                          const isFirstData = !hasSentData
                          hasSentData = true
                          foundAny = true
                          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`))
                          
                          if (isFirstData) {
                            const firstDataTime = Date.now() - firstByteTime
                            if (process.env.NODE_ENV === 'development') {
                              console.log('[Gemini] First data sent (TTFB:', firstDataTime, 'ms)')
                            }
                          }
                        }
                        
                        // 移动到下一个位置
                        searchStart = objEnd + 1
                      } catch (e) {
                        // 解析失败，移动到下一个位置
                        searchStart = objEnd + 1
                      }
                    }
                    
                    // 如果成功解析了对象，清理buffer
                    if (foundAny) {
                      // 保留未处理的部分（从最后一个 `{` 开始，因为可能不完整）
                      const lastObjStart = buffer.lastIndexOf('{')
                      if (lastObjStart !== -1 && searchStart > lastObjStart) {
                        buffer = buffer.substring(lastObjStart)
                      } else if (searchStart > 0) {
                        // 清理已处理的部分，但保留数组开始标记
                        const arrayStart = buffer.indexOf('[')
                        if (arrayStart !== -1) {
                          buffer = buffer.substring(Math.max(arrayStart, searchStart - 50))
                        } else {
                          buffer = buffer.substring(Math.max(0, searchStart - 50))
                        }
                      }
                    }
                    
                    // 备用策略：如果还没发送数据且buffer足够大，尝试解析完整数组
                    if (!hasSentData && buffer.length > 200) {
                      const arrayEnd = buffer.lastIndexOf(']')
                      if (arrayEnd !== -1 && arrayEnd > 10) {
                        try {
                          const arrayStr = buffer.substring(0, arrayEnd + 1)
                          const array = JSON.parse(arrayStr)
                          if (Array.isArray(array)) {
                            for (const item of array) {
                              const text = extractTextFromResponse(item)
                              if (text) {
                                hasSentData = true
                                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`))
                              }
                            }
                            buffer = buffer.substring(arrayEnd + 1)
                          }
                        } catch (e) {
                          // 忽略错误
                        }
                      }
                    }
                  } catch (e) {
                    // 忽略解析错误，继续累积
                  }
                } else {
                  // NDJSON格式：每行一个JSON对象
                  const lines = buffer.split('\n')
                  let lastLine = lines.pop() || ''
                  
                  let processedLines = 0
                  for (const line of lines) {
                    const trimmedLine = line.trim()
                    if (!trimmedLine) continue
                    
                    // 跳过非JSON行
                    if (!trimmedLine.startsWith('{') && !trimmedLine.startsWith('[')) {
                      continue
                    }
                    
                    try {
                      let response: any
                      try {
                        response = JSON.parse(trimmedLine)
                      } catch (parseError) {
                        // 清理后重试
                        const cleanedLine = trimmedLine
                          .replace(/^\uFEFF/, '')
                          .replace(/[\x00-\x1F\x7F]/g, '')
                          .trim()
                        
                        if (cleanedLine && (cleanedLine.startsWith('{') || cleanedLine.startsWith('['))) {
                          try {
                            response = JSON.parse(cleanedLine)
                          } catch (e2) {
                            lastLine = trimmedLine + '\n' + lastLine
                            continue
                          }
                        } else {
                          continue
                        }
                      }
                      
                      const text = extractTextFromResponse(response)
                      if (text) {
                        hasSentData = true
                        processedLines++
                        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`))
                        
                        if (processedLines === 1) {
                          const firstDataTime = Date.now() - firstByteTime
                          if (process.env.NODE_ENV === 'development') {
                            console.log('[Gemini] First data sent (TTFB:', firstDataTime, 'ms)')
                          }
                        }
                      }
                    } catch (e) {
                      lastLine = trimmedLine + '\n' + lastLine
                    }
                  }
                  
                  buffer = lastLine
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
    console.error('Gemini API proxy error:', error)
    return NextResponse.json({ error: '服务器异常，请稍后再试。' }, { status: 500 })
  }
}
