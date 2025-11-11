/**
 * API Route: Reset Password
 * 
 * POST /api/auth/reset-password
 * Body: { phone: string, code: string, newPassword: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import type { ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, code, newPassword } = body

    // 验证输入
    if (!phone || !code || !newPassword) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: '手机号、验证码和新密码都是必需的',
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

    // 验证密码格式
    if (newPassword.length < 6 || newPassword.length > 20) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: '密码长度必须在6-20个字符之间',
        },
        { status: 400 }
      )
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { phone },
    })

    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: '该手机号未注册',
        },
        { status: 404 }
      )
    }

    // 验证验证码
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
      data: { used: true, userId: user.id },
    })

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // 更新用户密码
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    return NextResponse.json<ApiResponse<null>>({
      success: true,
      message: '密码重置成功',
    })
  } catch (error) {
    console.error('重置密码错误:', error)
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












