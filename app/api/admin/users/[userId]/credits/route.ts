/**
 * 更新用户积分API
 * PUT /api/admin/users/[userId]/credits
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
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

    const { credits } = await request.json()

    if (typeof credits !== 'number' || credits < 0) {
      return NextResponse.json({ success: false, error: '无效的积分值' }, { status: 400 })
    }

    // 更新用户积分
    await prisma.user.update({
      where: { id: params.userId },
      data: { credits },
    })

    return NextResponse.json({
      success: true,
      message: '积分更新成功',
    })
  } catch (error) {
    console.error('[Admin Update Credits] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

