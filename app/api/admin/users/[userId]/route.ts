/**
 * 删除用户API
 * DELETE /api/admin/users/[userId]
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
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

    // 不能删除自己
    if (params.userId === decoded.id) {
      return NextResponse.json({ success: false, error: '不能删除自己的账号' }, { status: 400 })
    }

    // 删除用户（级联删除相关数据）
    await prisma.user.delete({
      where: { id: params.userId },
    })

    return NextResponse.json({
      success: true,
      message: '用户已删除',
    })
  } catch (error) {
    console.error('[Admin Delete User] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

