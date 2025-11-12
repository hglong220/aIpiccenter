/**
 * API Route: Register
 *
 * POST /api/auth/register
 * Body: { phone: string, code: string, username: string, password: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { attachAuthCookie, generateToken } from '@/lib/auth'
import type { ApiResponse, AuthResponse, User } from '@/types'

const PHONE_REGEX = /^1[3-9]\d{9}$/

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, code, username, password } = body as {
      phone?: string
      code?: string
      username?: string
      password?: string
    }

    if (!phone || !code || !username || !password) {
      return NextResponse.json<ApiResponse<AuthResponse>>(
        { success: false, error: '手机号、验证码、用户名和密码都是必需的' },
        { status: 400 }
      )
    }

    if (!PHONE_REGEX.test(phone)) {
      return NextResponse.json<ApiResponse<AuthResponse>>(
        { success: false, error: '手机号格式不正确' },
        { status: 400 }
      )
    }

    if (username.length < 3 || username.length > 30) {
      return NextResponse.json<ApiResponse<AuthResponse>>(
        { success: false, error: '用户名长度必须在 3-30 个字符之间' },
        { status: 400 }
      )
    }

    if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
      return NextResponse.json<ApiResponse<AuthResponse>>(
        { success: false, error: '用户名只能包含字母、数字、下划线和中文' },
        { status: 400 }
      )
    }

    if (password.length < 8 || password.length > 64) {
      return NextResponse.json<ApiResponse<AuthResponse>>(
        { success: false, error: '密码长度必须在 8-64 个字符之间' },
        { status: 400 }
      )
    }

    const existingPhone = await prisma.user.findUnique({ where: { phone } })
    if (existingPhone) {
      return NextResponse.json<ApiResponse<AuthResponse>>(
        { success: false, error: '该手机号已注册' },
        { status: 409 }
      )
    }

    const existingUsername = await prisma.user.findUnique({ where: { username } })
    if (existingUsername) {
      return NextResponse.json<ApiResponse<AuthResponse>>(
        { success: false, error: '该用户名已被使用' },
        { status: 409 }
      )
    }

    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        phone,
        code,
        type: 'register',
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
      return NextResponse.json<ApiResponse<AuthResponse>>(
        { success: false, error: '验证码无效或已过期' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        phone,
        username,
        password: hashedPassword,
        credits: 10,
        plan: 'free',
      },
    })

    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { used: true, userId: user.id },
    })

    const responseUser: User = {
      id: user.id,
      phone: user.phone,
      username: user.username ?? undefined,
      email: user.email ?? undefined,
      credits: user.credits,
      plan: user.plan,
      planExpiresAt: user.planExpiresAt?.toISOString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }

    const token = generateToken(responseUser)

    const response = NextResponse.json<ApiResponse<AuthResponse>>({
      success: true,
      data: {
        user: responseUser,
      },
      message: '注册成功',
    })

    attachAuthCookie(response, token)

    return response
  } catch (error) {
    console.error('注册错误:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'

    return NextResponse.json<ApiResponse<AuthResponse>>(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}