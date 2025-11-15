/**
 * 视频生成Webhook回调API
 * 
 * POST /api/video/webhook
 * 接收外部视频生成服务的异步回调
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAIRouter } from '@/lib/ai-router'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskId, status, videoUrl, error, progress } = body

    if (!taskId) {
      return NextResponse.json({
        success: false,
        error: '缺少taskId参数',
      }, { status: 400 })
    }

    // 查找任务
    const dbTask = await prisma.aITask.findUnique({
      where: { id: taskId },
    })

    if (!dbTask) {
      return NextResponse.json({
        success: false,
        error: '任务不存在',
      }, { status: 404 })
    }

    // 更新任务状态
    const updateData: any = {
      progress: progress !== undefined ? progress : dbTask.progress,
    }

    if (status === 'completed' || status === 'success') {
      updateData.status = 'success'
      updateData.resultData = JSON.stringify({ videoUrl })
      updateData.completedAt = new Date()
      updateData.progress = 100

      // 创建生成记录
      const requestData = JSON.parse(dbTask.requestData)
      await prisma.generation.create({
        data: {
          userId: dbTask.userId,
          type: 'video',
          prompt: requestData.prompt,
          videoUrl: videoUrl,
          model: dbTask.model || undefined,
          creditsUsed: 10,
          status: 'success',
        },
      })
    } else if (status === 'failed' || status === 'error') {
      updateData.status = 'failed'
      updateData.error = error || '视频生成失败'
      updateData.completedAt = new Date()

      // 退回积分
      await prisma.user.update({
        where: { id: dbTask.userId },
        data: {
          credits: {
            increment: 10,
          },
        },
      })
    } else if (status === 'processing' || status === 'running') {
      updateData.status = 'running'
      if (!dbTask.startedAt) {
        updateData.startedAt = new Date()
      }
    }

    await prisma.aITask.update({
      where: { id: taskId },
      data: updateData,
    })

    // 更新内存中的任务状态
    const router = getAIRouter()
    const memoryTask = router.getTask(taskId)
    if (memoryTask) {
      if (status === 'completed' || status === 'success') {
        memoryTask.status = 'success'
        memoryTask.result = { videoUrl }
        memoryTask.completedAt = new Date()
      } else if (status === 'failed' || status === 'error') {
        memoryTask.status = 'failed'
        memoryTask.error = error || '视频生成失败'
        memoryTask.completedAt = new Date()
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
    })
  } catch (error) {
    console.error('[Video Webhook API] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 })
  }
}

// 支持GET请求用于验证webhook URL
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Video webhook endpoint is active',
  })
}

