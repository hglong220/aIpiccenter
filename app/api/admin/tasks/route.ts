/**
 * 任务管理API
 * GET /api/admin/tasks
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
    const status = searchParams.get('status')

    const where: any = {}
    if (status && status !== 'all') {
      where.status = status
    }

    // 获取任务列表
    const tasks = await prisma.aITask.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100, // 限制返回数量
      select: {
        id: true,
        userId: true,
        taskType: true,
        status: true,
        model: true,
        progress: true,
        createdAt: true,
        startedAt: true,
        completedAt: true,
        error: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: tasks,
    })
  } catch (error) {
    console.error('[Admin Tasks] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

