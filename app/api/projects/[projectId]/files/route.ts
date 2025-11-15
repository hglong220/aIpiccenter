/**
 * 项目文件管理API
 * POST /api/projects/[projectId]/files - 添加文件到项目
 * DELETE /api/projects/[projectId]/files - 从项目移除文件
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ApiResponse } from '@/types'

// 添加文件到项目
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const token = getTokenFromCookies(request)
    if (!token) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '未提供认证令牌',
      }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '认证令牌无效或已过期',
      }, { status: 401 })
    }

    const project = await prisma.project.findUnique({
      where: { id: params.projectId },
    })

    if (!project) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '项目不存在',
      }, { status: 404 })
    }

    if (project.userId !== decoded.id) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '无权修改此项目',
      }, { status: 403 })
    }

    const body = await request.json()
    const { fileIds } = body

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'fileIds必须是数组且不能为空',
      }, { status: 400 })
    }

    // 验证文件属于当前用户
    const files = await prisma.file.findMany({
      where: {
        id: { in: fileIds },
        userId: decoded.id,
      },
    })

    if (files.length !== fileIds.length) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '部分文件不存在或无权限',
      }, { status: 400 })
    }

    // 批量添加文件到项目
    const projectFiles = await Promise.all(
      fileIds.map(fileId =>
        prisma.projectFile.upsert({
          where: {
            projectId_fileId: {
              projectId: params.projectId,
              fileId,
            },
          },
          create: {
            projectId: params.projectId,
            fileId,
          },
          update: {},
        })
      )
    )

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: {
        added: projectFiles.length,
      },
    })
  } catch (error) {
    console.error('[Project Files API] Error:', error)
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

// 从项目移除文件
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const token = getTokenFromCookies(request)
    if (!token) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '未提供认证令牌',
      }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '认证令牌无效或已过期',
      }, { status: 401 })
    }

    const project = await prisma.project.findUnique({
      where: { id: params.projectId },
    })

    if (!project) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '项目不存在',
      }, { status: 404 })
    }

    if (project.userId !== decoded.id) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '无权修改此项目',
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')

    if (!fileId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '缺少fileId参数',
      }, { status: 400 })
    }

    await prisma.projectFile.deleteMany({
      where: {
        projectId: params.projectId,
        fileId,
      },
    })

    return NextResponse.json<ApiResponse<null>>({
      success: true,
      message: '文件已从项目移除',
    })
  } catch (error) {
    console.error('[Project Files API] Error:', error)
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

