/**
 * API Route: Generate Video
 * 
 * This endpoint handles video generation requests from the frontend.
 * It integrates with Google Gemini API for actual video generation.
 * 
 * POST /api/generate/video
 * Body: VideoGenerationRequest
 * Response: ApiResponse<VideoGenerationResult>
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { VideoGenerationRequest, ApiResponse, VideoGenerationResult } from '@/types'
import { generateVideo } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request)

    if (!token) {
      return NextResponse.json<ApiResponse<VideoGenerationResult>>({
        success: false,
        error: '未提供认证令牌',
      }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json<ApiResponse<VideoGenerationResult>>({
        success: false,
        error: '认证令牌无效或已过期',
      }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    })

    if (!user) {
      return NextResponse.json<ApiResponse<VideoGenerationResult>>({
        success: false,
        error: '用户不存在',
      }, { status: 404 })
    }

    const body: VideoGenerationRequest = await request.json()

    // Validate request
    if (!body.prompt || !body.prompt.trim()) {
      return NextResponse.json<ApiResponse<VideoGenerationResult>>(
        {
          success: false,
          error: '提示词是必需的',
        },
        { status: 400 }
      )
    }

    // 如果提供了referenceFileId，获取文件信息
    let referenceImage: string | undefined = body.referenceImage

    if (body.referenceFileId) {
      const referenceFile = await prisma.file.findFirst({
        where: {
          id: body.referenceFileId,
          userId: user.id,
          fileType: { in: ['image', 'video'] }, // 视频生成可以使用图像或视频作为参考
          status: 'ready',
        },
        include: {
          metadata: true,
        },
      })

      if (!referenceFile) {
        return NextResponse.json<ApiResponse<VideoGenerationResult>>({
          success: false,
          error: '参考文件不存在或无权限访问',
        }, { status: 404 })
      }

      // 使用文件的存储URL或预览URL
      referenceImage = referenceFile.storageUrl || referenceFile.previewUrl || `/storage/${referenceFile.storagePath}`

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

      console.log(`[Video Generation] Using reference file: ${referenceFile.id} (${referenceFile.originalFilename})`)
    }

    // 构建包含参考文件的请求
    const generationRequest: VideoGenerationRequest = {
      ...body,
      referenceImage,
    }

    // Generate video
    // Note: This is a placeholder. Replace with actual Gemini API call
    // Pass undefined for onProgress since we're in API route
    const result = await generateVideo(generationRequest, undefined)

    return NextResponse.json<ApiResponse<VideoGenerationResult>>({
      success: true,
      data: result,
      message: 'Video generated successfully',
    })
  } catch (error) {
    console.error('Error generating video:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json<ApiResponse<VideoGenerationResult>>(
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

