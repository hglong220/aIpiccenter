/**
 * 视频生成API - 创建视频生成任务
 * 
 * POST /api/video/create
 * Body: VideoGenerationRequest
 * Response: { taskId, status }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAIRouter } from '@/lib/ai-router'
import type { VideoGenerationRequest, ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
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

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    })

    if (!user) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '用户不存在',
      }, { status: 404 })
    }

    // 解析请求
    const body: VideoGenerationRequest = await request.json()

    if (!body.prompt || !body.prompt.trim()) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '提示词是必需的',
      }, { status: 400 })
    }

    // 检查用户积分（视频生成消耗10积分）
    const videoCreditsCost = 10
    if (user.credits < videoCreditsCost) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: `积分不足，视频生成需要 ${videoCreditsCost} 积分`,
      }, { status: 400 })
    }

    // 使用AI路由器创建任务
    const router = getAIRouter()
    const task = await router.routeTask(user.id, {
      ...body,
      taskType: 'video',
    }, 'normal')

    // 任务已在 router.routeTask 中创建，这里不需要重复创建
    // 只需要更新预估时间
    await prisma.aiTask.update({
      where: { id: task.id },
      data: {
        estimatedTime: 120, // 视频生成预估2分钟
      },
    })

    // 扣除积分（先扣除，如果失败会退回）
    await prisma.user.update({
      where: { id: user.id },
      data: {
        credits: {
          decrement: videoCreditsCost,
        },
      },
    })

    return NextResponse.json<ApiResponse<{
      taskId: string
      status: string
      estimatedTime: number
    }>>({
      success: true,
      data: {
        taskId: task.id,
        status: task.status,
        estimatedTime: 120,
      },
    })
  } catch (error) {
    console.error('[Video Create API] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: errorMessage,
    }, { status: 500 })
  }
}

