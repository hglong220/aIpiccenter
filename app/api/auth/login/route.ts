/**
 * API Route: Login
 * 
 * POST /api/auth/login
 * Body: { phone?: string, username?: string, password?: string, code?: string, loginType: 'code' | 'password' }
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/auth'
import type { ApiResponse, AuthResponse } from '@/types'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, code, username, password, loginType } = body

    // loginType: 'code' | 'password'
    const usePassword = loginType === 'password'

    let user

    if (usePassword) {
      // 密码登录
      if (!password) {
        return NextResponse.json<ApiResponse<AuthResponse>>(
          {
            success: false,
            error: '密码是必需的',
          },
          { status: 400 }
        )
      }

      // 查找用户
      if (username) {
        // 使用用户名登录
        user = await prisma.user.findUnique({
          where: { username },
        })

        if (!user) {
          return NextResponse.json<ApiResponse<AuthResponse>>(
            {
              success: false,
              error: '用户名或密码错误',
            },
            { status: 401 }
          )
        }
      } else if (phone) {
        // 使用手机号登录
        user = await prisma.user.findUnique({
          where: { phone },
        })

        if (!user) {
          return NextResponse.json<ApiResponse<AuthResponse>>(
            {
              success: false,
              error: '手机号或密码错误',
            },
            { status: 401 }
          )
        }
      } else {
        return NextResponse.json<ApiResponse<AuthResponse>>(
          {
            success: false,
            error: '请输入手机号或用户名',
          },
          { status: 400 }
        )
      }

      // 验证密码
      if (!user.password) {
        return NextResponse.json<ApiResponse<AuthResponse>>(
          {
            success: false,
            error: '该账号未设置密码，请使用验证码登录',
          },
          { status: 400 }
        )
      }

      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (!isPasswordValid) {
        return NextResponse.json<ApiResponse<AuthResponse>>(
          {
            success: false,
            error: username ? '用户名或密码错误' : '手机号或密码错误',
          },
          { status: 401 }
        )
      }
    } else {
      // 验证码登录
      if (!phone || !code) {
        return NextResponse.json<ApiResponse<AuthResponse>>(
          {
            success: false,
            error: '手机号和验证码是必需的',
          },
          { status: 400 }
        )
      }

      // 查找用户
      if (username) {
        // 使用用户名登录
        user = await prisma.user.findUnique({
          where: { username },
        })

        if (!user) {
          return NextResponse.json<ApiResponse<AuthResponse>>(
            {
              success: false,
              error: '用户名不存在',
            },
            { status: 404 }
          )
        }

        // 验证手机号是否匹配
        if (user.phone !== phone) {
          return NextResponse.json<ApiResponse<AuthResponse>>(
            {
              success: false,
              error: '手机号与用户名不匹配',
            },
            { status: 400 }
          )
        }
      } else {
        // 使用手机号登录
        user = await prisma.user.findUnique({
          where: { phone },
        })

        if (!user) {
          return NextResponse.json<ApiResponse<AuthResponse>>(
            {
              success: false,
              error: '该手机号未注册',
            },
            { status: 404 }
          )
        }
      }

      // 验证验证码
      const verificationCode = await prisma.verificationCode.findFirst({
        where: {
          phone: user.phone,
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
    }

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
      message: '登录成功',
    })
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
