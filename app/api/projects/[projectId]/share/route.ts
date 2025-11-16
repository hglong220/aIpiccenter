/**
 * 项目分享API
 * PUT /api/projects/[projectId]/share
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
// Simple token generator
function generateShareToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
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
      return NextResponse.json({ success: false, error: '无权操作' }, { status: 403 })
    }

    const body = await request.json()
    const { isPublic } = body

    // 更新分享状态
    const updated = await prisma.project.update({
      where: { id: params.projectId },
      data: {
        isPublic: isPublic === true,
        shareToken: isPublic === true ? generateShareToken() : null,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        isPublic: updated.isPublic,
        shareToken: updated.shareToken,
      },
    })
  } catch (error) {
    console.error('[Project Share] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}
