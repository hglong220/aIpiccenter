/**
 * 项目管理API
 * GET /api/projects - 获取用户的项目列表
 * POST /api/projects - 创建新项目
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
// nanoid is not installed, using simple random string generator
function generateShareToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request)
    if (!token) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: '令牌无效' }, { status: 401 })
    }

    // 获取用户的项目列表
    const projects = await prisma.project.findMany({
      where: { userId: decoded.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: {
            files: true,
            generations: true,
          },
        },
      },
    })

    const projectsWithCounts = projects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      coverImage: project.coverUrl, // schema uses coverUrl
      isPublic: project.isPublic,
      shareToken: project.shareToken,
      tags: [], // tags not in schema yet, will add later
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      fileCount: project._count.files,
      generationCount: project._count.generations,
    }))

    return NextResponse.json({
      success: true,
      data: projectsWithCounts,
    })
  } catch (error) {
    console.error('[Projects] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request)
    if (!token) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: '令牌无效' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, tags } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: '项目名称不能为空' }, { status: 400 })
    }

    // 创建项目
    const project = await prisma.project.create({
      data: {
        userId: decoded.id,
        name: name.trim(),
        description: description?.trim() || null,
        isPublic: false,
        shareToken: null,
      },
    })

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
      },
    })
  } catch (error) {
    console.error('[Projects Create] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}
