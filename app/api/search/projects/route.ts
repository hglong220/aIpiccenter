/**
 * 项目搜索API
 * GET /api/search/projects?q=query&limit=20
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

const MAX_RESULTS = 50

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request)
    if (!token) {
      return NextResponse.json(
        { success: false, error: '未登录' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: '认证失效，请重新登录' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')?.trim()
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), MAX_RESULTS)

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: {
          results: [],
          total: 0,
        },
      })
    }

    // 搜索项目名称和描述
    const projects = await prisma.project.findMany({
      where: {
        userId: decoded.id,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        _count: {
          select: {
            files: true,
            generations: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit,
    })

    const results = projects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      coverUrl: project.coverUrl,
      isPublic: project.isPublic,
      shareToken: project.shareToken,
      fileCount: project._count.files,
      generationCount: project._count.generations,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    }))

    return NextResponse.json({
      success: true,
      data: {
        results,
        total: results.length,
      },
    })
  } catch (error) {
    console.error('项目搜索失败:', error)
    return NextResponse.json(
      { success: false, error: '服务器异常，请稍后再试' },
      { status: 500 }
    )
  }
}

