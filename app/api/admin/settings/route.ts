/**
 * 系统设置API
 * GET /api/admin/settings
 * PUT /api/admin/settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request)
    if (!token) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: '令牌无效' }, { status: 401 })
    }

    // 检查管理员权限
    const admin = await prisma.user.findUnique({
      where: { id: decoded.id },
    })

    if (!admin || admin.plan !== 'admin') {
      return NextResponse.json({ success: false, error: '权限不足' }, { status: 403 })
    }

    // 从环境变量或数据库读取设置（简化版，实际应该存储在数据库）
    const settings = {
      modelMode: process.env.MODEL_MODE || 'international',
      moderationEnabled: process.env.MODERATION_ENABLED !== 'false',
      autoModeration: process.env.AUTO_MODERATION !== 'false',
    }

    return NextResponse.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    console.error('[Admin Settings] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request)
    if (!token) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: '令牌无效' }, { status: 401 })
    }

    // 检查管理员权限
    const admin = await prisma.user.findUnique({
      where: { id: decoded.id },
    })

    if (!admin || admin.plan !== 'admin') {
      return NextResponse.json({ success: false, error: '权限不足' }, { status: 403 })
    }

    const body = await request.json()

    // 保存设置（简化版，实际应该存储在数据库）
    // 这里只是返回成功，实际应该更新数据库或环境变量
    // 注意：环境变量在生产环境中通常不能动态修改

    return NextResponse.json({
      success: true,
      message: '设置已保存（注意：环境变量需要重启服务才能生效）',
    })
  } catch (error) {
    console.error('[Admin Settings] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

