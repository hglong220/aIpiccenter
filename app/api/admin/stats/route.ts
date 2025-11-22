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

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const [
      totalUsers,
      newUsersToday,
      newUsersYesterday,
      totalOrders,
      ordersToday,
      paidOrders,
      totalRevenue,
      revenueToday,
      revenueYesterday,
      runningTasks,
      pendingTasks,
      failedTasksToday,
      totalGenerations,
      generationsToday,
      successfulGenerations,
      totalModerationLogs,
      passedModeration,
      rejectedModeration,
      pendingModeration,
      totalFiles,
      filesSize,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          createdAt: { gte: today },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: yesterday, lt: today },
        },
      }),
      prisma.order.count(),
      prisma.order.count({
        where: {
          createdAt: { gte: today },
        },
      }),
      prisma.order.count({
        where: { paymentStatus: 'paid' },
      }),
      prisma.order.aggregate({
        where: { paymentStatus: 'paid' },
        _sum: { amount: true },
      }),
      prisma.order.aggregate({
        where: {
          paymentStatus: 'paid',
          paidAt: { gte: today },
        },
        _sum: { amount: true },
      }),
      prisma.order.aggregate({
        where: {
          paymentStatus: 'paid',
          paidAt: { gte: yesterday, lt: today },
        },
        _sum: { amount: true },
      }),
      prisma.aITask.count({
        where: { status: 'running' },
      }),
      prisma.aITask.count({
        where: { status: 'pending' },
      }),
      prisma.aITask.count({
        where: {
          status: 'failed',
          createdAt: { gte: today },
        },
      }),
      prisma.generation.count(),
      prisma.generation.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.generation.count({
        where: { status: 'success' },
      }),
      prisma.moderationLog.count(),
      prisma.moderationLog.count({
        where: { passed: true },
      }),
      prisma.moderationLog.count({
        where: { passed: false },
      }),
      prisma.moderationLog.count({
        where: { action: 'review' },
      }),
      prisma.file.count(),
      prisma.file.aggregate({
        _sum: { size: true },
      }),
    ])

    // 计算趋势
    const userTrend = newUsersYesterday > 0
      ? ((newUsersToday - newUsersYesterday) / newUsersYesterday) * 100
      : newUsersToday > 0 ? 100 : 0

    const revenueTrend = (revenueYesterday._sum.amount || 0) > 0
      ? (((revenueToday._sum.amount || 0) - (revenueYesterday._sum.amount || 0)) / (revenueYesterday._sum.amount || 0)) * 100
      : (revenueToday._sum.amount || 0) > 0 ? 100 : 0

    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          today: newUsersToday,
          trend: Math.round(userTrend * 10) / 10,
        },
        orders: {
          total: totalOrders,
          today: ordersToday,
          paid: paidOrders,
        },
        revenue: {
          total: totalRevenue._sum.amount || 0,
          today: revenueToday._sum.amount || 0,
          trend: Math.round(revenueTrend * 10) / 10,
        },
        tasks: {
          running: runningTasks,
          pending: pendingTasks,
          failedToday: failedTasksToday,
        },
        generations: {
          total: totalGenerations,
          today: generationsToday,
          successful: successfulGenerations,
          successRate: totalGenerations > 0 ? Math.round((successfulGenerations / totalGenerations) * 100) : 0,
        },
        moderation: {
          total: totalModerationLogs,
          passed: passedModeration,
          rejected: rejectedModeration,
          pending: pendingModeration,
        },
        files: {
          total: totalFiles,
          totalSize: filesSize._sum.size || 0,
        },
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

