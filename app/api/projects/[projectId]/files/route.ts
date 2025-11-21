/**
 * 项目文件管理API
 * POST /api/projects/[projectId]/files - 添加文件到项目
 * DELETE /api/projects/[projectId]/files/[fileId] - 从项目移除文件
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
    const { fileId } = body

    if (!fileId) {
      return NextResponse.json({ success: false, error: '文件ID不能为空' }, { status: 400 })
    }

    // 检查文件是否存在
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    })

    if (!file) {
      return NextResponse.json({ success: false, error: '文件不存在' }, { status: 404 })
    }

    // 检查文件是否已添加到项目
    const existing = await prisma.projectFile.findUnique({
      where: {
        projectId_fileId: {
          projectId: params.projectId,
          fileId,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ success: false, error: '文件已在项目中' }, { status: 400 })
    }

    // 添加文件到项目
    await prisma.projectFile.create({
      data: {
        projectId: params.projectId,
        fileId,
      },
    })

    return NextResponse.json({
      success: true,
      message: '文件已添加到项目',
    })
  } catch (error) {
    console.error('[Project Add File] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string; fileId: string } }
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

    // 从项目移除文件
    await prisma.projectFile.delete({
      where: {
        projectId_fileId: {
          projectId: params.projectId,
          fileId: params.fileId,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: '文件已从项目移除',
    })
  } catch (error) {
    console.error('[Project Remove File] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}
