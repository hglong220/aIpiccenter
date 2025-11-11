import { NextResponse } from 'next/server'
import { ProxyAgent, setGlobalDispatcher } from 'undici'

const proxyUrl = process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY
if (proxyUrl) {
  try {
    setGlobalDispatcher(new ProxyAgent(proxyUrl))
  } catch (error) {
    console.warn('Failed to configure HTTP proxy agent:', error)
  }
}

type ChatMessagePayload = {
  role: 'user' | 'assistant'
  content: string
}

const GOOGLE_GEMINI_API_VERSION = process.env.GOOGLE_GEMINI_API_VERSION ?? 'v1'
const GOOGLE_GEMINI_MODEL = process.env.GOOGLE_GEMINI_MODEL ?? 'gemini-1.5-flash'
const GOOGLE_GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/${GOOGLE_GEMINI_API_VERSION}/models/${GOOGLE_GEMINI_MODEL}:generateContent`
const RAPIDAPI_ENDPOINT = 'https://gemini-pro-ai.p.rapidapi.com/'

function toGeminiContents(messages: ChatMessagePayload[]) {
  return messages.map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }],
  }))
}

function normalizeMessages(input: unknown): ChatMessagePayload[] {
  if (!Array.isArray(input)) {
    return []
  }

  return input
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const rawRole = (item as { role?: unknown }).role
      const role: ChatMessagePayload['role'] = rawRole === 'assistant' ? 'assistant' : 'user'
      const contentValue = (item as { content?: unknown }).content
      const content = typeof contentValue === 'string' ? contentValue.trim() : ''

      if (!content) {
        return null
      }

      return { role, content }
    })
    .filter((message): message is ChatMessagePayload => Boolean(message))
}

async function callGoogleGemini(messages: ChatMessagePayload[]) {
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    return null
  }

  try {
    const response = await fetch(`${GOOGLE_GEMINI_ENDPOINT}?key=${process.env.GOOGLE_GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: toGeminiContents(messages),
      }),
    })

    if (!response.ok) {
      const errorPayload = await response.text()
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
    console.warn('Google Gemini request failed, will try fallback.', error)
    return {
      ok: false as const,
      status: 503,
      error: '连接官方 Gemini API 超时或被阻断，请检查网络或稍后再试。',
    }
  }
}

async function callRapidGemini(messages: ChatMessagePayload[]) {
  if (!process.env.RAPIDAPI_GEMINI_KEY || !process.env.RAPIDAPI_GEMINI_HOST) {
    return null
  }

  const response = await fetch(RAPIDAPI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-rapidapi-host': process.env.RAPIDAPI_GEMINI_HOST,
      'x-rapidapi-key': process.env.RAPIDAPI_GEMINI_KEY,
    },
    body: JSON.stringify({
      contents: toGeminiContents(messages),
    }),
  })

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
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: '请求格式错误。' }, { status: 400 })
    }

    const prompt = typeof (body as { prompt?: unknown }).prompt === 'string' ? (body as { prompt?: string }).prompt.trim() : ''
    const inputMessages = normalizeMessages((body as { messages?: unknown }).messages)

    const conversation: ChatMessagePayload[] =
      inputMessages.length > 0
        ? inputMessages
        : prompt
          ? [{ role: 'user', content: prompt }]
          : []

    if (!conversation.length) {
      return NextResponse.json({ error: '请输入提示词。' }, { status: 400 })
    }

    const googleResult = await callGoogleGemini(conversation)
    if (googleResult) {
      if (!googleResult.ok) {
        return NextResponse.json({ error: googleResult.error }, { status: googleResult.status })
      }

      return NextResponse.json({
        text: googleResult.text,
        raw: googleResult.payload,
        source: 'google',
      })
    }

    const rapidResult = await callRapidGemini(conversation)
    if (rapidResult) {
      if (!rapidResult.ok) {
        if (rapidResult.status === 429) {
          return NextResponse.json({ error: '调用过于频繁，请稍后再试。' }, { status: rapidResult.status })
        }

        return NextResponse.json({ error: rapidResult.error }, { status: rapidResult.status })
      }

      return NextResponse.json({
        text: rapidResult.text,
        raw: rapidResult.payload,
        source: 'rapidapi',
      })
    }

    return NextResponse.json({ error: '未配置 Gemini API 密钥。' }, { status: 500 })
  } catch (error) {
    console.error('Gemini API proxy error:', error)
    return NextResponse.json({ error: '服务器异常，请稍后再试。' }, { status: 500 })
  }
}
