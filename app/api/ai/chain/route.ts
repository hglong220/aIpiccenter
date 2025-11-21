/**
 * 任务链 API
 * POST /api/ai/chain
 * 
 * 执行任务链（文本 → 图 → 视频等）
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAIRouter } from '@/lib/ai-router'

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request)
    if (!token) {
      return NextResponse.json(
        { success: false, error: '未授权' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: '令牌无效' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { steps } = body

    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json(
        { success: false, error: '任务链步骤不能为空' },
        { status: 400 }
      )
    }

    // 验证步骤格式
    for (const step of steps) {
      if (!step.taskType) {
        return NextResponse.json(
          { success: false, error: '每个步骤必须指定 taskType' },
          { status: 400 }
        )
      }
    }

    // 执行任务链
    const router = getAIRouter()
    const results = await router.executeTaskChain(decoded.id, { steps })

    return NextResponse.json({
      success: true,
      data: {
        results,
        stepsCount: steps.length,
      },
    })
  } catch (error) {
    console.error('Error executing task chain:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}

