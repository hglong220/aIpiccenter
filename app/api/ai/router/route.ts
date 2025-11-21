/**
 * AI Router API - 统一的AI调度接口
 * 
 * POST /api/ai/router
 * Body: {
 *   taskType?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'code' | 'composite',
 *   priority?: 'low' | 'normal' | 'high' | 'urgent',
 *   model?: string, // 可选，指定模型
 *   ...request // 其他请求参数
 * }
 * 
 * Response: {
 *   success: boolean,
 *   data: {
 *     taskId: string,
 *     status: 'pending' | 'running' | 'success' | 'failed',
 *     estimatedTime?: number
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAIRouter } from '@/lib/ai-router'
import type { ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    // 1. 验证用户身份
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

    // 2. 解析请求
    const body = await request.json()
    const { taskType, priority = 'normal', model, ...requestData } = body

    // 3. 如果指定了taskType，添加到request中
    if (taskType) {
      requestData.taskType = taskType
    }
    if (model) {
      requestData.model = model
    }

    // 4. 路由任务
    const router = getAIRouter()
    const task = await router.routeTask(user.id, requestData, priority)

    // 5. 返回任务ID和状态
    return NextResponse.json<ApiResponse<{
      taskId: string
      status: string
      estimatedTime?: number
    }>>({
      success: true,
      data: {
        taskId: task.id,
        status: task.status,
        estimatedTime: estimateTaskTime(task.type),
      },
    })
  } catch (error) {
    console.error('[AI Router API] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: errorMessage,
    }, { status: 500 })
  }
}

/**
 * 获取任务状态
 * GET /api/ai/router?taskId=xxx
 */
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

    // 获取任务状态
    const router = getAIRouter()
    const task = router.getTask(taskId)

    if (!task) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '任务不存在',
      }, { status: 404 })
    }

    // 验证任务属于当前用户
    if (task.userId !== decoded.id) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '无权访问此任务',
      }, { status: 403 })
    }

    return NextResponse.json<ApiResponse<{
      taskId: string
      status: string
      type: string
      model?: string
      result?: any
      error?: string
      progress?: number
      createdAt: string
      completedAt?: string
    }>>({
      success: true,
      data: {
        taskId: task.id,
        status: task.status,
        type: task.type,
        model: task.model,
        result: task.result,
        error: task.error,
        progress: calculateProgress(task),
        createdAt: task.createdAt.toISOString(),
        completedAt: task.completedAt?.toISOString(),
      },
    })
  } catch (error) {
    console.error('[AI Router API] Error getting task status:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: errorMessage,
    }, { status: 500 })
  }
}

/**
 * 估算任务时间（秒）
 */
function estimateTaskTime(taskType: string): number {
  switch (taskType) {
    case 'text':
      return 5
    case 'image':
      return 15
    case 'video':
      return 120
    case 'audio':
      return 30
    case 'document':
      return 20
    case 'code':
      return 10
    case 'composite':
      return 60
    default:
      return 10
  }
}

/**
 * 计算任务进度（0-100）
 */
function calculateProgress(task: any): number {
  if (task.status === 'success') return 100
  if (task.status === 'failed') return 0
  if (task.status === 'pending') return 0
  
  // 根据任务类型和运行时间估算进度
  const elapsed = task.startedAt 
    ? (Date.now() - task.startedAt.getTime()) / 1000 
    : 0
  
  const estimated = estimateTaskTime(task.type)
  return Math.min(95, Math.floor((elapsed / estimated) * 100))
}

