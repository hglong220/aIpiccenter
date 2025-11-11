/**
 * API Route: Update User Profile
 * 
 * PUT /api/user/update
 * Headers: { Authorization: Bearer <token> }
 * Body: { username?: string, email?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromHeader, verifyToken } from '@/lib/auth'
import type { ApiResponse, User } from '@/types'

export async function PUT(request: NextRequest) {
  try {
    // 验证用户身份
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader)

    if (!token) {
      return NextResponse.json<ApiResponse<User>>(
        {
          success: false,
          error: '未提供认证令牌',
        },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json<ApiResponse<User>>(
        {
          success: false,
          error: '认证令牌无效或已过期',
        },
        { status: 401 }
      )
    }

    // 解析请求体
    const body = await request.json()
    const { username, email } = body

    // 构建更新数据
    const updateData: {
      username?: string
      email?: string
    } = {}

    if (username !== undefined) {
      // 验证用户名格式
      if (username && (username.length < 3 || username.length > 20)) {
        return NextResponse.json<ApiResponse<User>>(
          {
            success: false,
            error: '用户名长度必须在3-20个字符之间',
          },
          { status: 400 }
        )
      }

      if (username && !/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
        return NextResponse.json<ApiResponse<User>>(
          {
            success: false,
            error: '用户名只能包含字母、数字、下划线和中文',
          },
          { status: 400 }
        )
      }

      // 检查用户名是否已被使用
      if (username) {
        const existingUser = await prisma.user.findUnique({
          where: { username },
        })

        if (existingUser && existingUser.id !== decoded.id) {
          return NextResponse.json<ApiResponse<User>>(
            {
              success: false,
              error: '该用户名已被使用',
            },
            { status: 400 }
          )
        }
      }

      updateData.username = username || null
    }

    if (email !== undefined) {
      // 验证邮箱格式
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json<ApiResponse<User>>(
          {
            success: false,
            error: '邮箱格式不正确',
          },
          { status: 400 }
        )
      }

      updateData.email = email || null
    }

    // 如果没有要更新的数据
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json<ApiResponse<User>>(
        {
          success: false,
          error: '没有要更新的数据',
        },
        { status: 400 }
      )
    }

    // 更新用户信息
    const user = await prisma.user.update({
      where: { id: decoded.id },
      data: updateData,
    })

    return NextResponse.json<ApiResponse<User>>({
      success: true,
      data: {
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
      message: '用户信息更新成功',
    })
  } catch (error) {
    console.error('更新用户信息错误:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'

    return NextResponse.json<ApiResponse<User>>(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

