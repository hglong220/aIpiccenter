/**
 * API Route: Get User Generations
 *
 * GET /api/generations
 * Auth: HttpOnly Cookie containing JWT token
 * Query: ?page=1&limit=10&type=image|video
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import type { ApiResponse, GenerationHistory } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request)

    if (!token) {
      return NextResponse.json<ApiResponse<GenerationHistory[]>>({
        success: false,
        error: '未提供认证令牌',
      }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json<ApiResponse<GenerationHistory[]>>({
        success: false,
        error: '认证令牌无效或已过期',
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const type = searchParams.get('type') as 'image' | 'video' | null
    const skip = (page - 1) * limit

    const where: {
      userId: string
      type?: 'image' | 'video'
    } = {
      userId: decoded.id,
    }

    if (type) {
      where.type = type
    }

    const [generations, total] = await Promise.all([
      prisma.generation.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.generation.count({ where }),
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
        generations: generations.map((gen) => ({
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

    return NextResponse.json<ApiResponse<GenerationHistory[]>>({
      success: false,
      error: errorMessage,
    }, { status: 500 })
  }
}

