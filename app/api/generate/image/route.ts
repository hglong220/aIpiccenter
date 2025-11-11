/**
 * API Route: Generate Image
 * 
 * This endpoint handles image generation requests from the frontend.
 * It integrates with Google Gemini API for actual image generation.
 * 
 * POST /api/generate/image
 * Body: ImageGenerationRequest
 * Response: ApiResponse<ImageGenerationResult>
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromHeader, verifyToken } from '@/lib/auth'
import type { ImageGenerationRequest, ApiResponse, ImageGenerationResult } from '@/types'
import { generateImage } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader)

    if (!token) {
      return NextResponse.json<ApiResponse<ImageGenerationResult>>(
        {
          success: false,
          error: '未提供认证令牌',
        },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json<ApiResponse<ImageGenerationResult>>(
        {
          success: false,
          error: '认证令牌无效或已过期',
        },
        { status: 401 }
      )
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    })

    if (!user) {
      return NextResponse.json<ApiResponse<ImageGenerationResult>>(
        {
          success: false,
          error: '用户不存在',
        },
        { status: 404 }
      )
    }

    const body: ImageGenerationRequest = await request.json()

    // Validate request
    if (!body.prompt || !body.prompt.trim()) {
      return NextResponse.json<ApiResponse<ImageGenerationResult>>(
        {
          success: false,
          error: '提示词是必需的',
        },
        { status: 400 }
      )
    }

    if (!body.width || !body.height || body.width < 256 || body.height < 256) {
      return NextResponse.json<ApiResponse<ImageGenerationResult>>(
        {
          success: false,
          error: '尺寸无效。最小尺寸为 256x256',
        },
        { status: 400 }
      )
    }

    const count = body.count || 1
    if (count < 1 || count > 4) {
      return NextResponse.json<ApiResponse<ImageGenerationResult>>(
        {
          success: false,
          error: '生成数量必须在 1-4 之间',
        },
        { status: 400 }
      )
    }

    // 检查信用点
    const creditsNeeded = count // 1 信用点 = 1 张图像
    if (user.credits < creditsNeeded) {
      return NextResponse.json<ApiResponse<ImageGenerationResult>>(
        {
          success: false,
          error: `信用点不足。您需要 ${creditsNeeded} 个信用点，当前有 ${user.credits} 个`,
        },
        { status: 400 }
      )
    }

    // 扣除信用点
    await prisma.user.update({
      where: { id: user.id },
      data: {
        credits: {
          decrement: creditsNeeded,
        },
      },
    })

    try {
      // Generate image
      const result = await generateImage(body, undefined)

      // 保存生成记录
      await prisma.generation.create({
        data: {
          userId: user.id,
          type: 'image',
          prompt: body.prompt,
          negativePrompt: body.negativePrompt,
          width: body.width,
          height: body.height,
          model: body.model,
          imageUrl: result.imageUrl,
          creditsUsed: creditsNeeded,
          status: 'completed',
        },
      })

      return NextResponse.json<ApiResponse<ImageGenerationResult>>({
        success: true,
        data: result,
        message: '图像生成成功',
      })
    } catch (error) {
      // 如果生成失败，退还信用点
      await prisma.user.update({
        where: { id: user.id },
        data: {
          credits: {
            increment: creditsNeeded,
          },
        },
      })

      throw error
    }
  } catch (error) {
    console.error('Error generating image:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    
    return NextResponse.json<ApiResponse<ImageGenerationResult>>(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

