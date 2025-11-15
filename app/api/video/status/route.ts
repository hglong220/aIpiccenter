/**
 * 视频生成状态查询API
 * 
 * GET /api/video/status?taskId=xxx
 * Response: { taskId, status, progress, result, error }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAIRouter } from '@/lib/ai-router'
import type { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
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

    // 获取任务ID
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '缺少taskId参数',
      }, { status: 400 })
    }

    // 从数据库获取任务
    const dbTask = await prisma.aITask.findUnique({
      where: { id: taskId },
    })

    if (!dbTask) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '任务不存在',
      }, { status: 404 })
    }

    // 验证任务属于当前用户
    if (dbTask.userId !== decoded.id) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '无权访问此任务',
      }, { status: 403 })
    }

    // 从内存路由器获取最新状态
    const router = getAIRouter()
    const memoryTask = router.getTask(taskId)

    // 合并数据库和内存状态
    const status = memoryTask?.status || dbTask.status
    const progress = memoryTask ? calculateProgress(memoryTask) : dbTask.progress
    const result = memoryTask?.result || (dbTask.resultData ? JSON.parse(dbTask.resultData) : null)
    const error = memoryTask?.error || dbTask.error

    // 如果任务完成，更新数据库
    if (status === 'success' && dbTask.status !== 'success') {
      await prisma.aITask.update({
        where: { id: taskId },
        data: {
          status: 'success',
          resultData: result ? JSON.stringify(result) : null,
          progress: 100,
          completedAt: new Date(),
        },
      })

      // 创建生成记录
      if (result?.videoUrl) {
        await prisma.generation.create({
          data: {
            userId: decoded.id,
            type: 'video',
            prompt: JSON.parse(dbTask.requestData).prompt,
            videoUrl: result.videoUrl,
            model: dbTask.model || undefined,
            creditsUsed: 10,
            status: 'success',
          },
        })
      }
    } else if (status === 'failed' && dbTask.status !== 'failed') {
      await prisma.aITask.update({
        where: { id: taskId },
        data: {
          status: 'failed',
          error: error || '任务失败',
          completedAt: new Date(),
        },
      })

      // 退回积分
      await prisma.user.update({
        where: { id: decoded.id },
        data: {
          credits: {
            increment: 10,
          },
        },
      })
    }

    return NextResponse.json<ApiResponse<{
      taskId: string
      status: string
      progress: number
      result?: any
      error?: string
      estimatedTime?: number
      createdAt: string
      completedAt?: string
    }>>({
      success: true,
      data: {
        taskId: dbTask.id,
        status,
        progress,
        result,
        error,
        estimatedTime: dbTask.estimatedTime || undefined,
        createdAt: dbTask.createdAt.toISOString(),
        completedAt: dbTask.completedAt?.toISOString(),
      },
    })
  } catch (error) {
    console.error('[Video Status API] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: errorMessage,
    }, { status: 500 })
  }
}

function calculateProgress(task: any): number {
  if (task.status === 'success') return 100
  if (task.status === 'failed') return 0
  if (task.status === 'pending') return 0
  
  const elapsed = task.startedAt 
    ? (Date.now() - task.startedAt.getTime()) / 1000 
    : 0
  
  const estimated = 120 // 视频生成预估2分钟
  return Math.min(95, Math.floor((elapsed / estimated) * 100))
}

