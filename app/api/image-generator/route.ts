import { NextRequest, NextResponse } from 'next/server'
import { ensureGeminiProxy } from '@/lib/proxy'
import { fetch, ProxyAgent } from 'undici'

// Vertex AI Imagen 配置
const VERTEX_AI_PROJECT = process.env.VERTEX_AI_PROJECT_ID || ''
const VERTEX_AI_LOCATION = process.env.VERTEX_AI_LOCATION || 'us-central1'
const VERTEX_AI_MODEL = process.env.VERTEX_AI_IMAGE_MODEL || 'imagegeneration@006'
const VERTEX_AI_ACCESS_TOKEN = process.env.VERTEX_AI_ACCESS_TOKEN || ''
const VERTEX_AI_SERVICE_ACCOUNT = process.env.VERTEX_AI_SERVICE_ACCOUNT || ''

// Gemini API 配置（回退方案）
const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || ''
const GEMINI_IMAGE_MODEL = process.env.GOOGLE_GEMINI_IMAGE_MODEL || 'gemini-2.5-pro'

// 检查是否配置了 Vertex AI
function isVertexAIConfigured(): boolean {
  return !!(
    VERTEX_AI_PROJECT &&
    (VERTEX_AI_ACCESS_TOKEN || VERTEX_AI_SERVICE_ACCOUNT)
  )
}

// 获取代理配置
function getProxyAgent(): ProxyAgent | undefined {
  const proxyUrl =
    process.env.GEMINI_PROXY_URL ||
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    null

  if (!proxyUrl) {
    return undefined
  }

  try {
    const agent = new ProxyAgent(proxyUrl)
    console.info('[Vertex AI] Proxy agent created for image generation:', proxyUrl)
    return agent
  } catch (error) {
    console.error('[Vertex AI] Failed to create proxy agent:', error)
    return undefined
  }
}

// 获取 Access Token（如果使用 Service Account）
async function getAccessToken(): Promise<string> {
  // 如果直接提供了 Access Token，直接使用
  if (VERTEX_AI_ACCESS_TOKEN) {
    return VERTEX_AI_ACCESS_TOKEN
  }

  // 如果有 Service Account JSON，需要获取 Access Token
  if (VERTEX_AI_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(VERTEX_AI_SERVICE_ACCOUNT)
      // 动态导入 google-auth-library（如果未安装会报错）
      const { GoogleAuth } = await import('google-auth-library').catch(() => {
        throw new Error('请先安装 google-auth-library: npm install google-auth-library')
      })
      const auth = new GoogleAuth({
        credentials: serviceAccount,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      })
      const client = await auth.getClient()
      const tokenResponse = await client.getAccessToken()
      return tokenResponse.token || ''
    } catch (error) {
      console.error('[Vertex AI] Failed to get access token from service account:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      throw new Error(`无法获取 Access Token: ${errorMessage}`)
    }
  }

  throw new Error('未配置 Vertex AI 认证信息（需要 VERTEX_AI_ACCESS_TOKEN 或 VERTEX_AI_SERVICE_ACCOUNT）')
}

interface GenerateImageBody {
  prompt?: string
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9'
  negativePrompt?: string
  width?: number
  height?: number
  numberOfImages?: number
  safetyFilterLevel?: 'BLOCK_MOST' | 'BLOCK_SOME' | 'BLOCK_ONLY_HIGH' | 'BLOCK_NONE'
  personGeneration?: 'ALLOW_ALL' | 'ALLOW_ADULT' | 'DONT_ALLOW'
}

// 将宽高比转换为像素尺寸
function getDimensionsFromAspectRatio(
  aspectRatio: string,
  defaultWidth: number = 1024,
  defaultHeight: number = 1024
): { width: number; height: number } {
  const ratioMap: Record<string, { width: number; height: number }> = {
    '1:1': { width: 1024, height: 1024 },
    '3:4': { width: 768, height: 1024 },
    '4:3': { width: 1024, height: 768 },
    '9:16': { width: 576, height: 1024 },
    '16:9': { width: 1024, height: 576 },
  }

  return ratioMap[aspectRatio] || { width: defaultWidth, height: defaultHeight }
}

// 使用 Gemini API 生成图像（回退方案）
async function generateImageWithGemini(
  prompt: string,
  aspectRatio: string | undefined,
  negativePrompt: string | undefined,
  proxyAgent: ProxyAgent | undefined
): Promise<NextResponse> {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { success: false, error: '未配置图像生成 API（需要 VERTEX_AI 或 GOOGLE_GEMINI_API_KEY）' },
      { status: 500 }
    )
  }

  const requestPayload: Record<string, unknown> = {
    model: GEMINI_IMAGE_MODEL,
    prompt: {
      text: prompt,
    },
  }

  if (negativePrompt?.trim()) {
    requestPayload.negativePrompt = {
      text: negativePrompt.trim(),
    }
  }

  if (aspectRatio) {
    requestPayload.aspectRatio = aspectRatio
  }

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
    body: JSON.stringify(requestPayload),
  }

  if (proxyAgent) {
    fetchOptions.dispatcher = proxyAgent
    console.info('[Gemini] Using proxy for image generation')
  }

  console.info('[Gemini] Using model:', GEMINI_IMAGE_MODEL)
  console.info('[Gemini] Falling back to Gemini API (Vertex AI not configured)')

  // 先尝试使用 generateImage 端点
  let response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateImage?key=${GEMINI_API_KEY}`,
    fetchOptions
  )

  // 如果 generateImage 端点不支持，尝试使用 generateContent 端点
  if (!response.ok && response.status === 404) {
    console.info('[Gemini] generateImage endpoint not supported, trying generateContent')
    
    const generateContentPayload = {
      contents: [
        {
          parts: [
            {
              text: `Generate an image based on this description: ${prompt}${aspectRatio ? ` (aspect ratio: ${aspectRatio})` : ''}${negativePrompt ? ` Avoid: ${negativePrompt}` : ''}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        ...(aspectRatio && { aspectRatio }),
      },
    }
    
    fetchOptions.body = JSON.stringify(generateContentPayload)
    
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      fetchOptions
    )
  }

  if (!response.ok) {
    const errorPayload = await response.text()
    console.error('[Gemini] Image API error:', response.status, errorPayload)
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

  // 解析 Gemini 响应
  const images: string[] =
    data?.candidates?.flatMap((candidate: any) =>
      candidate.content?.parts
        ?.filter((part: any) => part.inlineData?.data)
        .map((part: any) => {
          const mime = part.inlineData.mimeType || 'image/png'
          const base64 = part.inlineData.data
          return `data:${mime};base64,${base64}`
        }) || []
    ) ||
    data?.generatedImages?.map((item: { mimeType?: string; b64Json?: string; data?: string }) => {
      const base64 = item?.b64Json ?? item?.data ?? ''
      if (!base64) return ''
      const mime = item?.mimeType || 'image/png'
      return `data:${mime};base64,${base64}`
    }) ||
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
}

export async function POST(request: NextRequest) {
  try {
    ensureGeminiProxy()

    const body = (await request.json().catch(() => ({}))) as GenerateImageBody
    const prompt = body.prompt?.trim()

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: '请输入生成图像的描述 prompt' },
        { status: 400 }
      )
    }

    // 获取代理配置
    const proxyAgent = getProxyAgent()

    // 如果未配置 Vertex AI，回退到 Gemini API
    if (!isVertexAIConfigured()) {
      console.info('[Image Generator] Vertex AI not configured, using Gemini API fallback')
      return await generateImageWithGemini(
        prompt,
        body.aspectRatio,
        body.negativePrompt,
        proxyAgent
      )
    }

    // 使用 Vertex AI Imagen API
    console.info('[Image Generator] Using Vertex AI Imagen API')

    // 获取 Access Token
    let accessToken: string
    try {
      accessToken = await getAccessToken()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      return NextResponse.json(
        { success: false, error: `认证失败: ${errorMessage}` },
        { status: 401 }
      )
    }

    // 计算图像尺寸
    const dimensions = body.width && body.height
      ? { width: body.width, height: body.height }
      : getDimensionsFromAspectRatio(body.aspectRatio || '1:1')

    // 构建 Vertex AI Imagen API 请求
    const apiUrl = `https://${VERTEX_AI_LOCATION}-aiplatform.googleapis.com/v1/projects/${VERTEX_AI_PROJECT}/locations/${VERTEX_AI_LOCATION}/publishers/google/models/${VERTEX_AI_MODEL}:predict`

    const requestPayload = {
      instances: [
        {
          prompt: prompt,
          ...(body.negativePrompt && { negativePrompt: body.negativePrompt }),
          ...(dimensions && {
            sampleImageSize: `${dimensions.width}x${dimensions.height}`,
          }),
          ...(body.numberOfImages && { numberOfImages: Math.min(body.numberOfImages, 4) }),
          ...(body.safetyFilterLevel && { safetyFilterLevel: body.safetyFilterLevel }),
          ...(body.personGeneration && { personGeneration: body.personGeneration }),
        },
      ],
      parameters: {
        sampleCount: body.numberOfImages || 1,
      },
    }

    // Prepare fetch options with proxy support
    const fetchOptions: {
      method: string
      headers: Record<string, string>
      body: string
      dispatcher?: ProxyAgent
    } = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestPayload),
    }

    // Add proxy dispatcher if available
    if (proxyAgent) {
      fetchOptions.dispatcher = proxyAgent
      console.info('[Vertex AI] Using proxy for image generation')
    }

    console.info('[Vertex AI] Using model:', VERTEX_AI_MODEL)
    console.info('[Vertex AI] API URL:', apiUrl.replace(/projects\/[^/]+/, 'projects/***'))
    console.info('[Vertex AI] Request payload:', JSON.stringify(requestPayload, null, 2))

    // 发送请求到 Vertex AI
    const response = await fetch(apiUrl, fetchOptions)

    if (!response.ok) {
      const errorPayload = await response.text()
      console.error('[Vertex AI] API error:', response.status, errorPayload)
      
      let errorMessage = '图像生成失败，请稍后再试'
      if (response.status === 401) {
        errorMessage = '认证失败，请检查 Access Token 或 Service Account 配置'
      } else if (response.status === 403) {
        errorMessage = '权限不足，请检查项目权限和 API 启用状态'
      } else if (response.status === 429) {
        errorMessage = '生成请求过于频繁，请稍后再试'
      } else if (response.status === 400) {
        errorMessage = '请求参数错误，请检查 prompt 和参数设置'
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: errorPayload,
        },
        { status: response.status }
      )
    }

    const data = await response.json()

    // 解析 Vertex AI Imagen 响应
    // 响应格式: { predictions: [{ bytesBase64Encoded: "...", mimeType: "image/png" }] }
    const images: string[] =
      data?.predictions?.map((prediction: any) => {
        const base64 = prediction.bytesBase64Encoded || prediction.imageBytes || ''
        const mime = prediction.mimeType || 'image/png'
        if (!base64) return ''
        return `data:${mime};base64,${base64}`
      }) || []

    const filtered = images.filter((src) => src && src.length > 0)

    if (!filtered.length) {
      console.error('[Vertex AI] No images in response:', JSON.stringify(data, null, 2))
      return NextResponse.json(
        { success: false, error: '图像生成成功，但未返回可用的图像数据' },
        { status: 500 }
      )
    }

    console.info('[Vertex AI] Successfully generated', filtered.length, 'image(s)')

    return NextResponse.json({
      success: true,
      data: {
        images: filtered,
        prompt,
        dimensions,
      },
    })
  } catch (error) {
    console.error('[Image Generator] 生成图像异常:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    return NextResponse.json(
      { success: false, error: `服务器异常: ${errorMessage}` },
      { status: 500 }
    )
  }
}
