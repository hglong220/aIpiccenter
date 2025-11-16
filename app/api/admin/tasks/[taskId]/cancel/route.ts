/**
 * 取消任务API
 * POST /api/admin/tasks/[taskId]/cancel
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { aiQueue, videoQueue } from '@/lib/queues'

export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
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

    // 检查管理员权限
    const admin = await prisma.user.findUnique({
      where: { id: decoded.id },
    })

    if (!admin || admin.plan !== 'admin') {
      return NextResponse.json({ success: false, error: '权限不足' }, { status: 403 })
    }

    // 获取任务
    const task = await prisma.aiTask.findUnique({
      where: { id: params.taskId },
    })

    if (!task) {
      return NextResponse.json({ success: false, error: '任务不存在' }, { status: 404 })
    }

    // 从队列中移除任务
    const queue = task.taskType === 'video' ? videoQueue : aiQueue
    const job = await queue.getJob(params.taskId)
    if (job) {
      await job.remove()
    }

    // 更新任务状态
    await prisma.aiTask.update({
      where: { id: params.taskId },
      data: {
        status: 'failed',
        error: '任务已被管理员取消',
        completedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: '任务已取消',
    })
  } catch (error) {
    console.error('[Admin Cancel Task] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

