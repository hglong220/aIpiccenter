/**
 * 项目分享管理API
 * POST /api/projects/[projectId]/share - 生成/更新分享链接
 * DELETE /api/projects/[projectId]/share - 关闭分享链接
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ApiResponse } from '@/types'
import { randomBytes } from 'crypto'

// 生成/更新分享链接
export async function POST(
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
    const { expiresInDays } = body // 分享链接有效期（天）

    // 生成新的分享token
    const shareToken = randomBytes(32).toString('hex')
    const shareExpiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null

    const updated = await prisma.project.update({
      where: { id: params.projectId },
      data: {
        shareToken,
        shareExpiresAt,
        isPublic: true, // 启用分享时自动设为公开
      },
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const shareUrl = `${baseUrl}/projects/share/${shareToken}`

    return NextResponse.json<ApiResponse<{
      shareToken: string
      shareUrl: string
      expiresAt: string | null
    }>>({
      success: true,
      data: {
        shareToken: updated.shareToken!,
        shareUrl,
        expiresAt: updated.shareExpiresAt?.toISOString() || null,
      },
    })
  } catch (error) {
    console.error('[Project Share API] Error:', error)
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

// 关闭分享链接
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
        error: '无权修改此项目',
      }, { status: 403 })
    }

    await prisma.project.update({
      where: { id: params.projectId },
      data: {
        shareToken: null,
        shareExpiresAt: null,
        isPublic: false,
      },
    })

    return NextResponse.json<ApiResponse<null>>({
      success: true,
      message: '分享链接已关闭',
    })
  } catch (error) {
    console.error('[Project Share API] Error:', error)
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

