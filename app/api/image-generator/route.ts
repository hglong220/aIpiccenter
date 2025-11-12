import { NextRequest, NextResponse } from 'next/server'
import { ensureGeminiProxy } from '@/lib/proxy'

const DEFAULT_IMAGE_MODEL =
  process.env.GOOGLE_GEMINI_IMAGE_MODEL || 'imagegeneration@006'

interface GenerateImageBody {
  prompt?: string
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9'
  negativePrompt?: string
}

export async function POST(request: NextRequest) {
  try {
    ensureGeminiProxy()

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: '未配置 Google Gemini API 密钥' },
        { status: 500 }
      )
    }

    const body = (await request.json().catch(() => ({}))) as GenerateImageBody
    const prompt = body.prompt?.trim()

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: '请输入生成图像的描述 prompt' },
        { status: 400 }
      )
    }

    const requestPayload: Record<string, unknown> = {
      model: DEFAULT_IMAGE_MODEL,
      prompt: {
        text: prompt,
      },
    }

    if (body.negativePrompt?.trim()) {
      requestPayload.negativePrompt = {
        text: body.negativePrompt.trim(),
      }
    }

    if (body.aspectRatio) {
      requestPayload.aspectRatio = body.aspectRatio
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_IMAGE_MODEL}:generateImage?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      }
    )

    if (!response.ok) {
      const errorPayload = await response.text()
      console.error('Gemini image API error:', response.status, errorPayload)
      return NextResponse.json(
        {
          success: false,
          error:
            response.status === 429
              ? '生成请求过于频繁，请稍后再试'
              : '图像生成失败，请稍后再试',
        },
        { status: response.status }
      )
    }

    const data = await response.json()

    const images: string[] =
      data?.generatedImages?.map((item: { mimeType?: string; b64Json?: string; data?: string }) => {
        const base64 =
          item?.b64Json ??
          item?.data ??
          (item?.mimeType && data.images?.[0]?.imageBytes) ??
          ''
        if (!base64) return ''
        const mime =
          item?.mimeType ||
          (base64.trim().startsWith('/') ? 'image/jpeg' : 'image/png')
        return `data:${mime};base64,${base64}`
      }) ||
      data?.candidates?.flatMap((candidate: any) =>
        candidate.content?.parts
          ?.filter((part: any) => part.inlineData?.data)
          .map((part: any) => {
            const mime = part.inlineData.mimeType || 'image/png'
            return `data:${mime};base64,${part.inlineData.data}`
          }) || []
      ) ||
      []

    const filtered = images.filter((src) => src && src.length > 0)

    if (!filtered.length) {
      return NextResponse.json(
        { success: false, error: '图像生成成功，但未返回可用的图像数据' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        images: filtered,
        prompt,
      },
    })
  } catch (error) {
    console.error('生成图像异常:', error)
    return NextResponse.json(
      { success: false, error: '服务器异常，请稍后再试' },
      { status: 500 }
    )
  }
}


