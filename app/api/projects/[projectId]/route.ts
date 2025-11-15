/**
 * 项目详情API
 * GET /api/projects/[projectId] - 获取项目详情
 * PUT /api/projects/[projectId] - 更新项目
 * DELETE /api/projects/[projectId] - 删除项目
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ApiResponse } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const token = getTokenFromCookies(request)
    const decoded = token ? verifyToken(token) : null

    const project = await prisma.project.findUnique({
      where: { id: params.projectId },
      include: {
        files: {
          include: {
            file: true,
          },
        },
        generations: {
          include: {
            generation: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '项目不存在',
      }, { status: 404 })
    }

    // 检查权限
    if (!project.isPublic && (!decoded || project.userId !== decoded.id)) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '无权访问此项目',
      }, { status: 403 })
    }

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: {
        id: project.id,
        name: project.name,
        description: project.description,
        coverUrl: project.coverUrl,
        isPublic: project.isPublic,
        shareToken: project.shareToken,
        shareExpiresAt: project.shareExpiresAt,
        files: project.files.map(pf => pf.file),
        generations: project.generations.map(pg => pg.generation),
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    })
  } catch (error) {
    console.error('[Project Detail API] Error:', error)
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
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

    const project = await prisma.project.findUnique({
      where: { id: params.projectId },
    })

    if (!project) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '项目不存在',
      }, { status: 404 })
    }

    if (project.userId !== decoded.id) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '无权修改此项目',
      }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, coverUrl, isPublic } = body

    const updated = await prisma.project.update({
      where: { id: params.projectId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(coverUrl !== undefined && { coverUrl: coverUrl || null }),
        ...(isPublic !== undefined && { isPublic }),
      },
    })

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        coverUrl: updated.coverUrl,
        isPublic: updated.isPublic,
        shareToken: updated.shareToken,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    })
  } catch (error) {
    console.error('[Project Update API] Error:', error)
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
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

    const project = await prisma.project.findUnique({
      where: { id: params.projectId },
    })

    if (!project) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '项目不存在',
      }, { status: 404 })
    }

    if (project.userId !== decoded.id) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '无权删除此项目',
      }, { status: 403 })
    }

    await prisma.project.delete({
      where: { id: params.projectId },
    })

    return NextResponse.json<ApiResponse<null>>({
      success: true,
      message: '项目已删除',
    })
  } catch (error) {
    console.error('[Project Delete API] Error:', error)
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

