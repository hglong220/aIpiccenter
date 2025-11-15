/**
 * 项目管理API
 * GET /api/projects - 获取项目列表
 * POST /api/projects - 创建项目
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ApiResponse } from '@/types'
import { randomBytes } from 'crypto'

// 获取项目列表
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request)
    if (!token) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '未提供认证令牌',
      }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '认证令牌无效或已过期',
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: { userId: decoded.id },
        include: {
          files: {
            include: {
              file: {
                select: {
                  id: true,
                  originalFilename: true,
                  thumbnailUrl: true,
                  fileType: true,
                },
              },
            },
            take: 5, // 只显示前5个文件
          },
          generations: {
            include: {
              generation: {
                select: {
                  id: true,
                  type: true,
                  imageUrl: true,
                  videoUrl: true,
                },
              },
            },
            take: 5, // 只显示前5个生成记录
          },
          _count: {
            select: {
              files: true,
              generations: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.project.count({
        where: { userId: decoded.id },
      }),
    ])

    return NextResponse.json<ApiResponse<{
      projects: any[]
      total: number
      page: number
      limit: number
    }>>({
      success: true,
      data: {
        projects: projects.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          coverUrl: p.coverUrl,
          isPublic: p.isPublic,
          shareToken: p.shareToken,
          shareExpiresAt: p.shareExpiresAt,
          fileCount: p._count.files,
          generationCount: p._count.generations,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
        total,
        page,
        limit,
      },
    })
  } catch (error) {
    console.error('[Projects API] Error:', error)
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

// 创建项目
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request)
    if (!token) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '未提供认证令牌',
      }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '认证令牌无效或已过期',
      }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, coverUrl, isPublic = false } = body

    if (!name || !name.trim()) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '项目名称是必需的',
      }, { status: 400 })
    }

    // 生成分享token
    const shareToken = randomBytes(32).toString('hex')

    const project = await prisma.project.create({
      data: {
        userId: decoded.id,
        name: name.trim(),
        description: description?.trim() || null,
        coverUrl: coverUrl || null,
        isPublic: isPublic || false,
        shareToken,
      },
    })

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: {
        id: project.id,
        name: project.name,
        description: project.description,
        coverUrl: project.coverUrl,
        isPublic: project.isPublic,
        shareToken: project.shareToken,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    })
  } catch (error) {
    console.error('[Projects API] Error creating project:', error)
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

