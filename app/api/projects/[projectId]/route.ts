/**
 * 项目详情API
 * GET /api/projects/[projectId] - 获取项目详情
 * PUT /api/projects/[projectId] - 更新项目
 * DELETE /api/projects/[projectId] - 删除项目
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const token = getTokenFromCookies(request)
    if (!token) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: '令牌无效' }, { status: 401 })
    }

    // 获取项目详情
    const project = await prisma.project.findUnique({
      where: { id: params.projectId },
      include: {
        files: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        generations: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        _count: {
          select: {
            files: true,
            generations: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ success: false, error: '项目不存在' }, { status: 404 })
    }

    // 检查权限（项目所有者或公开项目）
    if (project.userId !== decoded.id && !project.isPublic) {
      return NextResponse.json({ success: false, error: '无权访问' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: project.id,
        name: project.name,
        description: project.description,
        coverImage: project.coverUrl,
        isPublic: project.isPublic,
        shareToken: project.shareToken,
        tags: [],
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        files: project.files,
        generations: project.generations,
        fileCount: project._count.files,
        generationCount: project._count.generations,
      },
    })
  } catch (error) {
    console.error('[Project Detail] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const token = getTokenFromCookies(request)
    if (!token) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: '令牌无效' }, { status: 401 })
    }

    // 检查项目所有权
    const project = await prisma.project.findUnique({
      where: { id: params.projectId },
    })

    if (!project) {
      return NextResponse.json({ success: false, error: '项目不存在' }, { status: 404 })
    }

    if (project.userId !== decoded.id) {
      return NextResponse.json({ success: false, error: '无权修改' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, coverImage } = body

    // 更新项目
    const updated = await prisma.project.update({
      where: { id: params.projectId },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        description: description !== undefined ? description.trim() || null : undefined,
        coverUrl: coverImage !== undefined ? coverImage : undefined,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        coverImage: updated.coverUrl,
        tags: [],
      },
    })
  } catch (error) {
    console.error('[Project Update] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const token = getTokenFromCookies(request)
    if (!token) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: '令牌无效' }, { status: 401 })
    }

    // 检查项目所有权
    const project = await prisma.project.findUnique({
      where: { id: params.projectId },
    })

    if (!project) {
      return NextResponse.json({ success: false, error: '项目不存在' }, { status: 404 })
    }

    if (project.userId !== decoded.id) {
      return NextResponse.json({ success: false, error: '无权删除' }, { status: 403 })
    }

    // 删除项目（级联删除相关数据）
    await prisma.project.delete({
      where: { id: params.projectId },
    })

    return NextResponse.json({
      success: true,
      message: '项目已删除',
    })
  } catch (error) {
    console.error('[Project Delete] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}
