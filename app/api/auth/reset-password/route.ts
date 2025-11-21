/**
 * API Route: Reset Password
 *
 * POST /api/auth/reset-password
 * Body: { phone: string, code: string, newPassword: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import type { ApiResponse } from '@/types'

const PHONE_REGEX = /^1[3-9]\d{9}$/

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, code, newPassword } = body as {
      phone?: string
      code?: string
      newPassword?: string
    }

    if (!phone || !code || !newPassword) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '手机号、验证码和新密码都是必需的',
      }, { status: 400 })
    }

    if (!PHONE_REGEX.test(phone)) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '手机号格式不正确',
      }, { status: 400 })
    }

    if (newPassword.length < 8 || newPassword.length > 64) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '密码长度必须在 8-64 个字符之间',
      }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { phone } })
    if (!user) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '该手机号未注册',
      }, { status: 404 })
    }

    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        phone,
        code,
        type: 'reset',
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
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '验证码无效或已过期',
      }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      prisma.verificationCode.update({
        where: { id: verificationCode.id },
        data: { used: true, userId: user.id },
      }),
    ])

    return NextResponse.json<ApiResponse<null>>({
      success: true,
      message: '密码重置成功，请使用新密码登录',
    })
  } catch (error) {
    console.error('重置密码错误:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'

    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: errorMessage,
    }, { status: 500 })
  }
}












