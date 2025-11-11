/**
 * API Route: Register
 * 
 * POST /api/auth/register
 * Body: { phone: string, code: string, username?: string, password?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import type { ApiResponse, AuthResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, code, username, password } = body

    // 验证输入：用户名和密码必填
    if (!username) {
      return NextResponse.json<ApiResponse<AuthResponse>>(
        {
          success: false,
          error: '用户名是必需的',
        },
        { status: 400 }
      )
    }

    if (!password) {
      return NextResponse.json<ApiResponse<AuthResponse>>(
        {
          success: false,
          error: '密码是必需的',
        },
        { status: 400 }
      )
    }

    if (!phone || !code) {
      return NextResponse.json<ApiResponse<AuthResponse>>(
        {
          success: false,
          error: '手机号和验证码是必需的',
        },
        { status: 400 }
      )
    }

    // 验证用户名格式
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json<ApiResponse<AuthResponse>>(
        {
          success: false,
          error: '用户名长度必须在3-20个字符之间',
        },
        { status: 400 }
      )
    }

    if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
      return NextResponse.json<ApiResponse<AuthResponse>>(
        {
          success: false,
          error: '用户名只能包含字母、数字、下划线和中文',
        },
        { status: 400 }
      )
    }

    // 验证密码格式
    if (password.length < 6 || password.length > 20) {
      return NextResponse.json<ApiResponse<AuthResponse>>(
        {
          success: false,
          error: '密码长度必须在6-20个字符之间',
        },
        { status: 400 }
      )
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json<ApiResponse<AuthResponse>>(
        {
          success: false,
          error: '手机号格式不正确',
        },
        { status: 400 }
      )
    }

    // 检查用户名是否已存在
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUsername) {
      return NextResponse.json<ApiResponse<AuthResponse>>(
        {
          success: false,
          error: '该用户名已被使用',
        },
        { status: 400 }
      )
    }

    // 检查手机号是否已注册
    const existingPhone = await prisma.user.findUnique({
      where: { phone },
    })

    if (existingPhone) {
      return NextResponse.json<ApiResponse<AuthResponse>>(
        {
          success: false,
          error: '该手机号已注册',
        },
        { status: 400 }
      )
    }

    // 验证验证码
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
      data: { used: true, userId: null }, // 稍后关联用户ID
    })

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 创建用户
    const user = await prisma.user.create({
      data: {
        phone,
        username,
        password: hashedPassword,
        credits: 10, // 新用户赠送10个信用点
        plan: 'free',
      },
    })

    // 更新验证码关联的用户ID
    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { userId: user.id },
    })

    // 生成 token
    const token = generateToken({
      id: user.id,
      username: user.username || undefined,
      phone: user.phone,
      email: user.email || undefined,
      credits: user.credits,
      plan: user.plan,
      planExpiresAt: user.planExpiresAt?.toISOString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    })

    return NextResponse.json<ApiResponse<AuthResponse>>({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username || undefined,
          phone: user.phone,
          email: user.email || undefined,
          credits: user.credits,
          plan: user.plan,
          planExpiresAt: user.planExpiresAt?.toISOString(),
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
        token,
      },
      message: '注册成功',
    })
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

