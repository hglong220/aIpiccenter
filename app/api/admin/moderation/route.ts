/**
 * 内容审核记录API
 * GET /api/admin/moderation
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    // 检查管理员权限
    const admin = await prisma.user.findUnique({
      where: { id: decoded.id },
    })

    if (!admin || admin.plan !== 'admin') {
      return NextResponse.json({ success: false, error: '权限不足' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const passed = searchParams.get('passed')
    const riskLevel = searchParams.get('riskLevel')

    const where: any = {}
    if (passed !== null) {
      where.passed = passed === 'true'
    }
    if (riskLevel && riskLevel !== 'all') {
      where.riskLevel = riskLevel
    }

    // 获取审核记录
    const logs = await prisma.moderationLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        userId: true,
        contentType: true,
        riskLevel: true,
        passed: true,
        score: true,
        reason: true,
        action: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: logs,
    })
  } catch (error) {
    console.error('[Admin Moderation] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

