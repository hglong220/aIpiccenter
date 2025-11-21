/**
 * API Route: Verify Code
 * 
 * POST /api/auth/verify-code
 * Body: { phone: string, code: string, type: 'register' | 'login' | 'reset' }
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, code, type } = body

    // 验证输入
    if (!phone || !code || !type) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: '手机号、验证码和类型是必需的',
        },
        { status: 400 }
      )
    }

    // 查找验证码
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        phone,
        code,
        type,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!verificationCode) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: '验证码无效或已过期',
        },
        { status: 400 }
      )
    }

    // 标记验证码为已使用
    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { used: true },
    })

    return NextResponse.json<ApiResponse<null>>({
      success: true,
      message: '验证码验证成功',
    })
  } catch (error) {
    console.error('验证验证码错误:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'

    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

