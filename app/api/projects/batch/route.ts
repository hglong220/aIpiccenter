/**
 * 批量操作API
 * DELETE /api/projects/batch - 批量删除项目
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request)
    if (!token) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: '令牌无效' }, { status: 401 })
    }

    const body = await request.json()
    const { projectIds } = body

    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      return NextResponse.json({ success: false, error: '无效的项目ID列表' }, { status: 400 })
    }

    // 检查所有项目是否属于当前用户
    const projects = await prisma.project.findMany({
      where: {
        id: { in: projectIds },
      },
    })

    const unauthorizedProjects = projects.filter((p) => p.userId !== decoded.id)
    if (unauthorizedProjects.length > 0) {
      return NextResponse.json(
        { success: false, error: '部分项目无权删除' },
        { status: 403 }
      )
    }

    // 批量删除
    await prisma.project.deleteMany({
      where: {
        id: { in: projectIds },
        userId: decoded.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: `成功删除 ${projectIds.length} 个项目`,
    })
  } catch (error) {
    console.error('[Projects Batch Delete] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

