/**
 * API Route: Get Current User
 * 
 * GET /api/auth/me
 * Headers: { Authorization: Bearer <token> }
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromHeader, verifyToken } from '@/lib/auth'
import type { ApiResponse, User } from '@/types'

export async function GET(request: NextRequest) {
  try {
    // 获取 token
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

    // 验证 token
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

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    })

    if (!user) {
      return NextResponse.json<ApiResponse<User>>(
        {
          success: false,
          error: '用户不存在',
        },
        { status: 404 }
      )
    }

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
    })
  } catch (error) {
    console.error('获取用户信息错误:', error)
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

