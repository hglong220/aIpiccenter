/**
 * 管理员统计API
 * GET /api/admin/stats
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
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    })

    if (!user || user.plan !== 'admin') {
      return NextResponse.json({ success: false, error: '权限不足' }, { status: 403 })
    }

    // 获取统计数据
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      totalUsers,
      newUsersToday,
      totalOrders,
      ordersToday,
      runningTasks,
      pendingTasks,
      totalModerationLogs,
      passedModeration,
      rejectedModeration,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          createdAt: { gte: today },
        },
      }),
      prisma.order.count(),
      prisma.order.count({
        where: {
          createdAt: { gte: today },
        },
      }),
      prisma.aiTask.count({
        where: { status: 'running' },
      }),
      prisma.aiTask.count({
        where: { status: 'pending' },
      }),
      prisma.moderationLog.count(),
      prisma.moderationLog.count({
        where: { passed: true },
      }),
      prisma.moderationLog.count({
        where: { passed: false },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        newUsersToday,
        totalOrders,
        ordersToday,
        runningTasks,
        pendingTasks,
        moderationLogs: totalModerationLogs,
        passedModeration,
        rejectedModeration,
      },
    })
  } catch (error) {
    console.error('[Admin Stats] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

