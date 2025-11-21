import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import type { ApiResponse } from '@/types'

interface FeedbackPayload {
  type: string
  content: string
  page?: string
  metadata?: Record<string, unknown>
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request)

    if (!token) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: '未登录，无法提交反馈',
        },
        { status: 401 },
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: '认证令牌无效或已过期',
        },
        { status: 401 },
      )
    }

    const body = (await request.json()) as FeedbackPayload

    if (!body.type || !body.content?.trim()) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: '反馈类型和内容不能为空',
        },
        { status: 400 },
      )
    }

    await prisma.feedback.create({
      data: {
        userId: decoded.id,
        type: body.type,
        content: body.content.trim(),
        page: body.page,
        metadata: body.metadata ? JSON.stringify(body.metadata) : null,
      },
    })

    return NextResponse.json<ApiResponse<null>>({
      success: true,
      message: '反馈已提交，我们会尽快查看处理。',
    })
  } catch (error) {
    console.error('提交反馈失败:', error)
    const message = error instanceof Error ? error.message : '未知错误'

    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 },
  )
}


