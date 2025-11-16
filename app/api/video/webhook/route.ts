/**
 * 视频生成Webhook接收端点
 * 
 * POST /api/video/webhook
 * Body: Webhook payload from video generation service
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAIRouter } from '@/lib/ai-router'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskId, status, videoUrl, thumbnailUrl, progress, error } = body

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: '缺少taskId' },
        { status: 400 }
      )
    }

    // 查找任务
    const task = await prisma.aITask.findUnique({
      where: { id: taskId },
    })

    if (!task) {
      return NextResponse.json(
        { success: false, error: '任务不存在' },
        { status: 404 }
      )
    }

    // 更新任务状态
    const updateData: any = {
      status: status || task.status,
      progress: progress !== undefined ? progress : task.progress,
    }

    if (status === 'completed' || status === 'success') {
      updateData.status = 'success'
      updateData.progress = 100
      updateData.completedAt = new Date()
      updateData.resultData = JSON.stringify({
        videoUrl,
        thumbnailUrl,
      })
    } else if (status === 'failed' || status === 'error') {
      updateData.status = 'failed'
      updateData.error = error || '视频生成失败'
      updateData.completedAt = new Date()
    }

    await prisma.aITask.update({
      where: { id: taskId },
      data: updateData,
    })

    // 如果成功，创建生成记录
    if (status === 'completed' || status === 'success') {
      await prisma.generation.create({
        data: {
          userId: task.userId,
          type: 'video',
          prompt: JSON.parse(task.requestData).prompt || '',
          videoUrl,
          model: task.model || undefined,
          creditsUsed: 10,
          status: 'success',
        },
      })
    } else if (status === 'failed' || status === 'error') {
      // 退回积分
      await prisma.user.update({
        where: { id: task.userId },
        data: {
          credits: {
            increment: 10,
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook处理成功',
    })
  } catch (error) {
    console.error('[Video Webhook] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}

// 支持GET请求用于验证webhook URL
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Video webhook endpoint is active',
  })
}
