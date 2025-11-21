/**
 * AI Orchestrate API - 高层编排入口
 *
 * POST /api/ai/orchestrate
 *
 * Body: {
 *   goal: string;                // 用户高层目标（自然语言）
 *   input?: any;                 // 可选：结构化输入（prompt、参数等）
 *   files?: any[];               // 可选：已上传文件/素材信息
 *   preferences?: {              // 可选：调度偏好
 *     budget?: 'low' | 'normal' | 'high';
 *     quality?: 'standard' | 'high' | 'max';
 *     speed?: 'standard' | 'fast';
 *     priority?: 'low' | 'normal' | 'high' | 'urgent';
 *   };
 *   preferredTaskType?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'code' | 'composite';
 * }
 *
 * Response (sync 执行版，直接返回任务链结果）:
 * {
 *   success: boolean;
 *   data?: {
 *     chainId: string;
 *     stepsCount: number;
 *     results: any[];
 *   };
 *   error?: string;
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/types'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAIRouter } from '@/lib/ai-router'
import { AICommander } from '@/lib/ai-commander'

export async function POST(request: NextRequest) {
  try {
    // 1. 校验用户身份
    const token = getTokenFromCookies(request)
    if (!token) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: '未提供认证令牌',
        },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: '认证令牌无效或已过期',
        },
        { status: 401 }
      )
    }

    // 2. 查询用户，获取订阅计划（入门 / 基础 / 专业 / 旗舰）
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    })

    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: '用户不存在',
        },
        { status: 404 }
      )
    }

    // 3. 解析请求体
    const body = await request.json()
    const {
      goal,
      input,
      files,
      preferences,
      preferredTaskType,
    } = body || {}

    if (!goal || typeof goal !== 'string' || !goal.trim()) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: '缺少 goal 字段，或格式不正确',
        },
        { status: 400 }
      )
    }

    // 4. 根据订阅计划推导基础偏好，再与前端传入的偏好合并
    const planPreferences = AICommander.getPreferencesForPlan(user.plan)
    const mergedPreferences = {
      ...planPreferences,
      ...(preferences || {}),
    }

    // 5. 通过 AI Commander 规划任务链（包含订阅计划信息）
    const commanderPlan = await AICommander.planTaskChain({
      goal: goal.trim(),
      input,
      files,
      userProfile: {
        id: decoded.id,
        level: (user.plan || 'free') as any,
      },
      preferences: mergedPreferences,
      preferredTaskType,
    })

    // 将 commanderPlan 转换为 AIRouter 所需的 chain 结构
    const chain = {
      steps: commanderPlan.steps.map(step => ({
        taskType: step.taskType,
        model: step.model,
        input: step.input,
        dependsOn: step.dependsOn,
      })),
    }

    const router = getAIRouter()

    // 6. 同步执行任务链（内部通过队列 + 轮询等待）
    const results = await router.executeTaskChain(decoded.id, chain)

    // 7. 返回执行结果
    return NextResponse.json<
      ApiResponse<{
        chainId: string
        stepsCount: number
        results: any[]
      }>
    >({
      success: true,
      data: {
        chainId: commanderPlan.id,
        stepsCount: commanderPlan.steps.length,
        results,
      },
    })
  } catch (error: any) {
    console.error('[AI Orchestrate API] Error:', error)
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred'

    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    )
  }
}


