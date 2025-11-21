/**
 * API Route: Get Current User
 *
 * GET /api/auth/me
 * Auth: HttpOnly Cookie containing JWT token
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import type { ApiResponse, User } from '@/types'
import { getCached, CacheKeys } from '@/lib/cache'

export async function GET(request: NextRequest) {
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

    // 使用缓存获取用户信息（缓存5分钟）
    const user = await getCached(
      CacheKeys.user(decoded.id),
      async () => {
        return await prisma.user.findUnique({
          where: { id: decoded.id },
        })
      },
      300 // 5分钟缓存
    )

    if (!user) {
      return NextResponse.json<ApiResponse<User>>({
        success: false,
        error: '用户不存在',
      }, { status: 404 })
    }

    return NextResponse.json<ApiResponse<User>>({
      success: true,
      data: {
        id: user.id,
        username: user.username ?? undefined,
        phone: user.phone,
        email: user.email ?? undefined,
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

    return NextResponse.json<ApiResponse<User>>({
      success: false,
      error: errorMessage,
    }, { status: 500 })
  }
}

