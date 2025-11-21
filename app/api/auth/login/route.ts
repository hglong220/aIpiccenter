/**
 * API Route: Login
 *
 * POST /api/auth/login
 * Body: { phone: string, code?: string, password?: string, loginType?: 'code' | 'password' }
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
    const { phone, code, password, loginType } = body as {
      phone?: string
      code?: string
      password?: string
      loginType?: 'code' | 'password'
    }

    if (!phone) {
      return NextResponse.json<ApiResponse<AuthResponse>>(
        { success: false, error: '用户名或手机号是必需的' },
        { status: 400 }
      )
    }

    // 判断输入的是手机号还是用户名
    const isPhone = PHONE_REGEX.test(phone)
    
    if (!isPhone && phone.length < 3) {
      return NextResponse.json<ApiResponse<AuthResponse>>(
        { success: false, error: '请输入有效的手机号或用户名' },
        { status: 400 }
      )
    }

    // 根据输入类型查找用户
    let user
    if (isPhone) {
      // 手机号登录
      user = await prisma.user.findUnique({
        where: { phone },
      })
      
      if (!user) {
        return NextResponse.json<ApiResponse<AuthResponse>>(
          { success: false, error: '该手机号未注册' },
          { status: 404 }
        )
      }
    } else {
      // 用户名登录
      user = await prisma.user.findUnique({
        where: { username: phone }, // 这里 phone 变量实际是用户名
      })
      
      if (!user) {
        return NextResponse.json<ApiResponse<AuthResponse>>(
          { success: false, error: '该用户名不存在' },
          { status: 404 }
        )
      }
    }

    const usePassword = loginType === 'password'

    if (usePassword) {
      if (!password) {
        return NextResponse.json<ApiResponse<AuthResponse>>(
          { success: false, error: '请输入密码' },
          { status: 400 }
        )
      }

      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (!isPasswordValid) {
        return NextResponse.json<ApiResponse<AuthResponse>>(
          { success: false, error: '用户名/手机号或密码错误' },
          { status: 401 }
        )
      }
    } else {
      // 验证码登录只支持手机号
      if (!isPhone) {
        return NextResponse.json<ApiResponse<AuthResponse>>(
          { success: false, error: '验证码登录需要使用手机号' },
          { status: 400 }
        )
      }
      
      if (!code) {
        return NextResponse.json<ApiResponse<AuthResponse>>(
          { success: false, error: '验证码是必需的' },
          { status: 400 }
        )
      }

      const verificationCode = await prisma.verificationCode.findFirst({
        where: {
          phone: user.phone, // 使用用户的手机号
          code,
          type: 'login',
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

      await prisma.verificationCode.update({
        where: { id: verificationCode.id },
        data: { used: true, userId: user.id },
      })
    }

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
      message: '登录成功',
    })

    attachAuthCookie(response, token)

    return response
  } catch (error) {
    console.error('登录错误:', error)
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