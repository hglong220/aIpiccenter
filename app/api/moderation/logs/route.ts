/**
 * 审核日志 API
 * GET /api/moderation/logs - 获取审核日志列表
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request)
    if (!token) {
      return NextResponse.json(
        { success: false, error: '未授权' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: '令牌无效' },
        { status: 401 }
      )
    }

    // 检查是否为管理员（简化版，实际应该从数据库查询）
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    })

    if (!user || user.plan !== 'admin') {
      return NextResponse.json(
        { success: false, error: '权限不足' },
        { status: 403 }
      )
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const contentType = searchParams.get('contentType')
    const riskLevel = searchParams.get('riskLevel')
    const action = searchParams.get('action')

    // 构建查询条件
    const where: any = {}
    if (contentType) where.contentType = contentType
    if (riskLevel) where.riskLevel = riskLevel
    if (action) where.action = action

    // 查询日志
    const [logs, total] = await Promise.all([
      prisma.moderationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      }),
      prisma.moderationLog.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Error fetching moderation logs:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}

