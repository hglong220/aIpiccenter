/**
 * API Route: Get User Generations
 * 
 * GET /api/generations
 * Headers: { Authorization: Bearer <token> }
 * Query: ?page=1&limit=10&type=image|video
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromHeader, verifyToken } from '@/lib/auth'
import type { ApiResponse, GenerationHistory } from '@/types'

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader)

    if (!token) {
      return NextResponse.json<ApiResponse<GenerationHistory[]>>(
        {
          success: false,
          error: '未提供认证令牌',
        },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json<ApiResponse<GenerationHistory[]>>(
        {
          success: false,
          error: '认证令牌无效或已过期',
        },
        { status: 401 }
      )
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type') as 'image' | 'video' | null
    const skip = (page - 1) * limit

    // 构建查询条件
    const where: {
      userId: string
      type?: 'image' | 'video'
    } = {
      userId: decoded.id,
    }

    if (type) {
      where.type = type
    }

    // 查询生成记录
    const [generations, total] = await Promise.all([
      prisma.generation.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.generation.count({
        where,
      }),
    ])

    return NextResponse.json<ApiResponse<{
      generations: GenerationHistory[]
      total: number
      page: number
      limit: number
      totalPages: number
    }>>({
      success: true,
      data: {
        generations: generations.map(gen => ({
          id: gen.id,
          userId: gen.userId,
          type: gen.type as 'image' | 'video',
          prompt: gen.prompt,
          negativePrompt: gen.negativePrompt || undefined,
          width: gen.width || undefined,
          height: gen.height || undefined,
          model: gen.model || undefined,
          imageUrl: gen.imageUrl || undefined,
          videoUrl: gen.videoUrl || undefined,
          creditsUsed: gen.creditsUsed,
          status: gen.status,
          createdAt: gen.createdAt.toISOString(),
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('获取生成记录错误:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'

    return NextResponse.json<ApiResponse<GenerationHistory[]>>(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

