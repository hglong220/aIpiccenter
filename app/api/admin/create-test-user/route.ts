/**
 * API Route: Create Test User
 * 
 * 创建测试用户账号（仅用于开发环境）
 * 
 * POST /api/admin/create-test-user
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import type { ApiResponse, AuthResponse } from '@/types'
import { generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // 仅允许在开发环境使用
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: '此功能仅在开发环境可用',
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { phone, username, password, email } = body

    // 默认测试账号信息
    const adminPhone = phone || '13800138000'
    const adminUsername = username || 'admin'
    const adminPassword = password || 'admin123'
    const adminEmail = email || 'admin@aipiccenter.com'

    // 检查账号是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: adminPhone },
          { username: adminUsername },
        ],
      },
    })

    if (existingUser) {
      // 更新信用点
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          credits: 1000,
          plan: 'enterprise',
        },
      })

      const token = generateToken({
        id: updatedUser.id,
        username: updatedUser.username || undefined,
        phone: updatedUser.phone,
        email: updatedUser.email || undefined,
        credits: updatedUser.credits,
        plan: updatedUser.plan,
        planExpiresAt: updatedUser.planExpiresAt?.toISOString(),
        createdAt: updatedUser.createdAt.toISOString(),
        updatedAt: updatedUser.updatedAt.toISOString(),
      })

      return NextResponse.json<ApiResponse<AuthResponse>>({
        success: true,
        data: {
          user: {
            id: updatedUser.id,
            username: updatedUser.username || undefined,
            phone: updatedUser.phone,
            email: updatedUser.email || undefined,
            credits: updatedUser.credits,
            plan: updatedUser.plan,
            planExpiresAt: updatedUser.planExpiresAt?.toISOString(),
            createdAt: updatedUser.createdAt.toISOString(),
            updatedAt: updatedUser.updatedAt.toISOString(),
          },
          token,
        },
        message: '测试账号已存在，已更新信用点',
      })
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(adminPassword, 10)

    // 创建管理员账号
    const admin = await prisma.user.create({
      data: {
        phone: adminPhone,
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword,
        credits: 1000,
        plan: 'enterprise',
        planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    })

    const token = generateToken({
      id: admin.id,
      username: admin.username || undefined,
      phone: admin.phone,
      email: admin.email || undefined,
      credits: admin.credits,
      plan: admin.plan,
      planExpiresAt: admin.planExpiresAt?.toISOString(),
      createdAt: admin.createdAt.toISOString(),
      updatedAt: admin.updatedAt.toISOString(),
    })

    return NextResponse.json<ApiResponse<AuthResponse>>({
      success: true,
      data: {
        user: {
          id: admin.id,
          username: admin.username || undefined,
          phone: admin.phone,
          email: admin.email || undefined,
          credits: admin.credits,
          plan: admin.plan,
          planExpiresAt: admin.planExpiresAt?.toISOString(),
          createdAt: admin.createdAt.toISOString(),
          updatedAt: admin.updatedAt.toISOString(),
        },
        token,
      },
      message: '测试管理员账号创建成功',
    })
  } catch (error) {
    console.error('创建测试账号错误:', error)
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


















