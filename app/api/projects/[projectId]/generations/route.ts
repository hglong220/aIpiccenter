/**
 * 项目生成记录管理API
 * POST /api/projects/[projectId]/generations - 添加生成记录到项目
 * DELETE /api/projects/[projectId]/generations/[generationId] - 从项目移除生成记录
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
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

    // 检查项目所有权
    const project = await prisma.project.findUnique({
      where: { id: params.projectId },
    })

    if (!project) {
      return NextResponse.json({ success: false, error: '项目不存在' }, { status: 404 })
    }

    if (project.userId !== decoded.id) {
      return NextResponse.json({ success: false, error: '无权操作' }, { status: 403 })
    }

    const body = await request.json()
    const { generationId } = body

    if (!generationId) {
      return NextResponse.json({ success: false, error: '生成记录ID不能为空' }, { status: 400 })
    }

    // 检查生成记录是否存在
    const generation = await prisma.generation.findUnique({
      where: { id: generationId },
    })

    if (!generation) {
      return NextResponse.json({ success: false, error: '生成记录不存在' }, { status: 404 })
    }

    // 检查生成记录是否已添加到项目
    const existing = await prisma.projectGeneration.findUnique({
      where: {
        projectId_generationId: {
          projectId: params.projectId,
          generationId,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ success: false, error: '生成记录已在项目中' }, { status: 400 })
    }

    // 添加生成记录到项目
    await prisma.projectGeneration.create({
      data: {
        projectId: params.projectId,
        generationId,
      },
    })

    return NextResponse.json({
      success: true,
      message: '生成记录已添加到项目',
    })
  } catch (error) {
    console.error('[Project Add Generation] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string; generationId: string } }
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

    // 检查项目所有权
    const project = await prisma.project.findUnique({
      where: { id: params.projectId },
    })

    if (!project) {
      return NextResponse.json({ success: false, error: '项目不存在' }, { status: 404 })
    }

    if (project.userId !== decoded.id) {
      return NextResponse.json({ success: false, error: '无权操作' }, { status: 403 })
    }

    // 从项目移除生成记录
    await prisma.projectGeneration.delete({
      where: {
        projectId_generationId: {
          projectId: params.projectId,
          generationId: params.generationId,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: '生成记录已从项目移除',
    })
  } catch (error) {
    console.error('[Project Remove Generation] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

