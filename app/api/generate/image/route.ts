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
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import type { ImageGenerationRequest, ApiResponse, ImageGenerationResult } from '@/types'
import { generateImage } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request)

    if (!token) {
      return NextResponse.json<ApiResponse<ImageGenerationResult>>({
        success: false,
        error: '未提供认证令牌',
      }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json<ApiResponse<ImageGenerationResult>>({
        success: false,
        error: '认证令牌无效或已过期',
      }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    })

    if (!user) {
      return NextResponse.json<ApiResponse<ImageGenerationResult>>({
        success: false,
        error: '用户不存在',
      }, { status: 404 })
    }

    const body: ImageGenerationRequest = await request.json()

    // Validate request
    if (!body.prompt || !body.prompt.trim()) {
      return NextResponse.json<ApiResponse<ImageGenerationResult>>({
        success: false,
        error: '提示词是必需的',
      }, { status: 400 })
    }

    // 如果提供了referenceFileId，获取文件信息
    let referenceImage: string | undefined = body.referenceImage
    let referenceImageName: string | undefined = body.referenceImageName

    if (body.referenceFileId) {
      const referenceFile = await prisma.file.findFirst({
        where: {
          id: body.referenceFileId,
          userId: user.id,
          fileType: 'image',
          status: 'ready',
        },
        include: {
          metadata: true,
        },
      })

      if (!referenceFile) {
        return NextResponse.json<ApiResponse<ImageGenerationResult>>({
          success: false,
          error: '参考文件不存在或无权限访问',
        }, { status: 404 })
      }

      // 使用文件的存储URL或预览URL
      referenceImage = referenceFile.storageUrl || referenceFile.previewUrl || `/storage/${referenceFile.storagePath}`
      referenceImageName = referenceFile.originalFilename

      // 如果是本地文件，尝试读取为base64（可选）
      if (referenceImage.startsWith('/storage/') || referenceImage.startsWith('/uploads/')) {
        try {
          const fs = await import('fs/promises')
          const path = await import('path')
          const filePath = path.join(process.cwd(), 'storage', referenceFile.storagePath)
          const fileBuffer = await fs.readFile(filePath)
          referenceImage = `data:${referenceFile.mimeType};base64,${fileBuffer.toString('base64')}`
        } catch (error) {
          console.warn('Failed to read reference file as base64, using URL instead:', error)
          // 继续使用URL
        }
      }

      console.log(`[Image Generation] Using reference file: ${referenceFile.id} (${referenceFile.originalFilename})`)
    }

    if (!body.width || !body.height || body.width < 256 || body.height < 256) {
      return NextResponse.json<ApiResponse<ImageGenerationResult>>({
        success: false,
        error: '尺寸无效。最小尺寸为 256x256',
      }, { status: 400 })
    }

    const count = body.count || 1
    if (count < 1 || count > 4) {
      return NextResponse.json<ApiResponse<ImageGenerationResult>>({
        success: false,
        error: '生成数量必须在 1-4 之间',
      }, { status: 400 })
    }

    const creditsNeeded = count
    if (user.credits < creditsNeeded) {
      return NextResponse.json<ApiResponse<ImageGenerationResult>>({
        success: false,
        error: `信用点不足。您需要 ${creditsNeeded} 个信用点，当前有 ${user.credits} 个`,
      }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        credits: {
          decrement: creditsNeeded,
        },
      },
    })

    try {
      // 构建包含参考图像的请求
      const generationRequest: ImageGenerationRequest = {
        ...body,
        referenceImage,
        referenceImageName,
      }

      const result = await generateImage(generationRequest, undefined)

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

    return NextResponse.json<ApiResponse<ImageGenerationResult>>({
      success: false,
      error: errorMessage,
    }, { status: 500 })
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

