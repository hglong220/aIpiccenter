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

const GOOGLE_GEMINI_API_VERSION = process.env.GOOGLE_GEMINI_API_VERSION ?? 'v1'
const GOOGLE_GEMINI_MODEL = process.env.GOOGLE_GEMINI_MODEL ?? 'gemini-1.5-flash'
const GOOGLE_GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/${GOOGLE_GEMINI_API_VERSION}/models/${GOOGLE_GEMINI_MODEL}:generateContent`
const RAPIDAPI_ENDPOINT = 'https://gemini-pro-ai.p.rapidapi.com/'

async function callGoogleGemini(prompt: string) {
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
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
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

async function callRapidGemini(prompt: string) {
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
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
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

    if (!body || typeof body.prompt !== 'string' || !body.prompt.trim()) {
      return NextResponse.json({ error: '请输入提示词。' }, { status: 400 })
    }

    const prompt = body.prompt.trim()

    const googleResult = await callGoogleGemini(prompt)
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

    const rapidResult = await callRapidGemini(prompt)
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
