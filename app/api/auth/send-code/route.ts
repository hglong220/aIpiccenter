/**
 * API Route: Send Verification Code
 * 
 * POST /api/auth/send-code
 * Body: { phone: string, type: 'register' | 'login' | 'reset' }
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendVerificationCode, generateVerificationCode } from '@/lib/sms'
import type { ApiResponse } from '@/types'

// 验证码有效期（5分钟）
const CODE_EXPIRES_IN = 5 * 60 * 1000

// 同一手机号发送间隔（60秒）
const SEND_INTERVAL = 60 * 1000

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, type } = body

    // 验证输入
    if (!phone || !type) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: '手机号和类型是必需的',
        },
        { status: 400 }
      )
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: '手机号格式不正确',
        },
        { status: 400 }
      )
    }

    // 验证类型
    if (!['register', 'login', 'reset'].includes(type)) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: '类型必须是 register、login 或 reset',
        },
        { status: 400 }
      )
    }

    // 检查发送频率限制
    const recentCode = await prisma.verificationCode.findFirst({
      where: {
        phone,
        createdAt: {
          gte: new Date(Date.now() - SEND_INTERVAL),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (recentCode) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: '发送过于频繁，请稍后再试',
        },
        { status: 429 }
      )
    }

    // 如果是注册，检查手机号是否已存在
    if (type === 'register') {
      const existingUser = await prisma.user.findUnique({
        where: { phone },
      })

      if (existingUser) {
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            error: '该手机号已注册',
          },
          { status: 400 }
        )
      }
    }

    // 如果是登录或重置密码，检查手机号是否存在
    if (type === 'login' || type === 'reset') {
      const existingUser = await prisma.user.findUnique({
        where: { phone },
      })

      if (!existingUser) {
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            error: '该手机号未注册',
          },
          { status: 400 }
        )
      }
    }

    // 生成验证码
    const code = generateVerificationCode()
    const expiresAt = new Date(Date.now() + CODE_EXPIRES_IN)

    // 保存验证码到数据库
    await prisma.verificationCode.create({
      data: {
        phone,
        code,
        type,
        expiresAt,
      },
    })

    // 发送短信
    const sent = await sendVerificationCode(phone, code, type)

    if (!sent) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: '验证码发送失败，请稍后再试',
        },
        { status: 500 }
      )
    }

    return NextResponse.json<ApiResponse<null>>({
      success: true,
      message: '验证码已发送',
    })
  } catch (error) {
    console.error('发送验证码错误:', error)
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

