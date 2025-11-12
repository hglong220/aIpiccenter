/**
 * API Route: Update User Profile
 *
 * PUT /api/user/update
 * Auth: HttpOnly Cookie containing JWT token
 * Body: { username?: string, email?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import type { ApiResponse, User } from '@/types'

export async function PUT(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request)

    if (!token) {
      return NextResponse.json<ApiResponse<User>>({
        success: false,
        error: '未提供认证令牌',
      }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json<ApiResponse<User>>({
        success: false,
        error: '认证令牌无效或已过期',
      }, { status: 401 })
    }

    const body = await request.json()
    const { username, email } = body as { username?: string; email?: string }

    const updateData: {
      username?: string | null
      email?: string
    } = {}

    if (username !== undefined) {
      if (username && (username.length < 3 || username.length > 30)) {
        return NextResponse.json<ApiResponse<User>>({
          success: false,
          error: '用户名长度必须在3-30个字符之间',
        }, { status: 400 })
      }

      if (username && !/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
        return NextResponse.json<ApiResponse<User>>({
          success: false,
          error: '用户名只能包含字母、数字、下划线和中文',
        }, { status: 400 })
      }

      if (username) {
        const existingUser = await prisma.user.findUnique({
          where: { username },
        })

        if (existingUser && existingUser.id !== decoded.id) {
          return NextResponse.json<ApiResponse<User>>({
            success: false,
            error: '该用户名已被使用',
          }, { status: 409 })
        }
      }

      updateData.username = username || null
    }

    if (email !== undefined) {
      if (!email) {
        return NextResponse.json<ApiResponse<User>>({
          success: false,
          error: '邮箱不能为空',
        }, { status: 400 })
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json<ApiResponse<User>>({
          success: false,
          error: '邮箱格式不正确',
        }, { status: 400 })
      }

      const existingEmail = await prisma.user.findUnique({
        where: { email },
      })

      if (existingEmail && existingEmail.id !== decoded.id) {
        return NextResponse.json<ApiResponse<User>>({
          success: false,
          error: '该邮箱已被使用',
        }, { status: 409 })
      }

      updateData.email = email
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json<ApiResponse<User>>({
        success: false,
        error: '没有要更新的数据',
      }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: decoded.id },
      data: updateData,
    })

    return NextResponse.json<ApiResponse<User>>({
      success: true,
      data: {
        id: user.id,
        username: user.username ?? undefined,
        email: user.email,
        phone: user.phone ?? undefined,
        credits: user.credits,
        plan: user.plan,
        planExpiresAt: user.planExpiresAt?.toISOString(),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      message: '用户信息更新成功',
    })
  } catch (error) {
    console.error('更新用户信息错误:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'

    return NextResponse.json<ApiResponse<User>>({
      success: false,
      error: errorMessage,
    }, { status: 500 })
  }
}

