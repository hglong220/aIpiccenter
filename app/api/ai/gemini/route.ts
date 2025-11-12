import { NextResponse } from 'next/server'
import { fetch, ProxyAgent, Agent } from 'undici'

const GOOGLE_GEMINI_MODEL = process.env.GOOGLE_GEMINI_MODEL ?? 'gemini-1.5-flash'
const GOOGLE_GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GOOGLE_GEMINI_MODEL}:generateContent`
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

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)

    if (!body || typeof body.prompt !== 'string' || !body.prompt.trim()) {
      return NextResponse.json({ error: '请输入提示词。' }, { status: 400 })
    }

    const prompt = body.prompt.trim()

    // 调试：输出环境变量配置
    console.log('[Gemini] Environment check:')
    console.log('[Gemini] GOOGLE_GEMINI_API_KEY:', process.env.GOOGLE_GEMINI_API_KEY ? 'Set' : 'Not set')
    console.log('[Gemini] GOOGLE_GEMINI_MODEL:', process.env.GOOGLE_GEMINI_MODEL || 'default')
    console.log('[Gemini] GEMINI_PROXY_URL:', process.env.GEMINI_PROXY_URL || 'Not set')
    console.log('[Gemini] HTTPS_PROXY:', process.env.HTTPS_PROXY || 'Not set')
    console.log('[Gemini] HTTP_PROXY:', process.env.HTTP_PROXY || 'Not set')

    // 只使用 Google Gemini API（通过代理绕过墙）
    const googleResult = await callGoogleGemini(prompt)
    if (googleResult && googleResult.ok) {
      return NextResponse.json({
        text: googleResult.text,
        raw: googleResult.payload,
        source: 'google',
      })
    }

    // Google API 失败，返回错误（不再使用 RapidAPI）
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
        error: 'Google Gemini API 调用失败。请检查网络连接和代理配置。如果使用代理，请确保设置了 GEMINI_PROXY_URL、HTTPS_PROXY 或 HTTP_PROXY 环境变量。',
      },
      { status: 503 },
    )
  } catch (error) {
    console.error('Gemini API proxy error:', error)
    return NextResponse.json({ error: '服务器异常，请稍后再试。' }, { status: 500 })
  }
}
