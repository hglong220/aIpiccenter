/**
 * API Route: File Operations
 * 
 * GET /api/files/[fileId] - 获取文件详情
 * DELETE /api/files/[fileId] - 删除文件
 * PATCH /api/files/[fileId] - 更新文件信息
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createStorageProvider, getStorageConfig } from '@/lib/storage'
import type { ApiResponse } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const token = getTokenFromCookies(request)

    if (!token) {
      return NextResponse.json<ApiResponse<any>>({
        success: false,
        error: '未提供认证令牌',
      }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json<ApiResponse<any>>({
        success: false,
        error: '认证令牌无效或已过期',
      }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    })

    if (!user) {
      return NextResponse.json<ApiResponse<any>>({
        success: false,
        error: '用户不存在',
      }, { status: 404 })
    }

    const fileId = params.fileId
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        metadata: true,
      },
    })

    if (!file) {
      return NextResponse.json<ApiResponse<any>>({
        success: false,
        error: '文件不存在',
      }, { status: 404 })
    }

    // 检查权限
    if (file.accessLevel === 'private' && file.userId !== user.id) {
      return NextResponse.json<ApiResponse<any>>({
        success: false,
        error: '无权访问此文件',
      }, { status: 403 })
    }

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: {
        id: file.id,
        filename: file.originalFilename,
        mimeType: file.mimeType,
        fileType: file.fileType,
        size: file.size,
        url: file.storageUrl || `/storage/${file.storagePath}`,
        previewUrl: file.previewUrl,
        thumbnailUrl: file.thumbnailUrl,
        status: file.status,
        moderationStatus: file.moderationStatus,
        accessLevel: file.accessLevel,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
        metadata: file.metadata,
      },
    })
  } catch (error) {
    console.error('Error fetching file:', error)
    const errorMessage = error instanceof Error ? error.message : '获取文件详情时发生错误'
    
    return NextResponse.json<ApiResponse<any>>({
      success: false,
      error: errorMessage,
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileId: string } }
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

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    })

    if (!user) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '用户不存在',
      }, { status: 404 })
    }

    const fileId = params.fileId
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    })

    if (!file) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '文件不存在',
      }, { status: 404 })
    }

    // 检查权限
    if (file.userId !== user.id) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '无权删除此文件',
      }, { status: 403 })
    }

    // 删除存储中的文件
    try {
      const storage = createStorageProvider(getStorageConfig())
      await storage.delete(file.storagePath)
      console.log(`[File Management] Deleted file from storage: ${file.storagePath}`)
      
      // 删除预览和缩略图
      if (file.thumbnailUrl) {
        try {
          await storage.delete(`thumbnails/${file.filename}`)
          console.log(`[File Management] Deleted thumbnail: thumbnails/${file.filename}`)
        } catch (thumbError) {
          console.warn(`[File Management] Failed to delete thumbnail:`, thumbError)
        }
      }
      if (file.previewUrl) {
        try {
          await storage.delete(`covers/${file.filename}`)
          console.log(`[File Management] Deleted preview: covers/${file.filename}`)
        } catch (previewError) {
          console.warn(`[File Management] Failed to delete preview:`, previewError)
        }
      }
    } catch (storageError) {
      console.error(`[File Management] Failed to delete file from storage: ${file.storagePath}`, storageError)
      // 继续删除数据库记录，即使存储删除失败
    }

    // 删除数据库记录（级联删除相关记录）
    await prisma.file.delete({
      where: { id: fileId },
    })

    return NextResponse.json<ApiResponse<null>>({
      success: true,
      message: '文件已删除',
    })
  } catch (error) {
    console.error('Error deleting file:', error)
    const errorMessage = error instanceof Error ? error.message : '删除文件时发生错误'
    
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: errorMessage,
    }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const token = getTokenFromCookies(request)

    if (!token) {
      return NextResponse.json<ApiResponse<any>>({
        success: false,
        error: '未提供认证令牌',
      }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json<ApiResponse<any>>({
        success: false,
        error: '认证令牌无效或已过期',
      }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    })

    if (!user) {
      return NextResponse.json<ApiResponse<any>>({
        success: false,
        error: '用户不存在',
      }, { status: 404 })
    }

    const fileId = params.fileId
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    })

    if (!file) {
      return NextResponse.json<ApiResponse<any>>({
        success: false,
        error: '文件不存在',
      }, { status: 404 })
    }

    if (file.userId !== user.id) {
      return NextResponse.json<ApiResponse<any>>({
        success: false,
        error: '无权修改此文件',
      }, { status: 403 })
    }

    const body = await request.json()
    const { accessLevel } = body

    // 更新文件信息
    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: {
        accessLevel: accessLevel || file.accessLevel,
      },
    })

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: {
        id: updatedFile.id,
        accessLevel: updatedFile.accessLevel,
      },
      message: '文件信息已更新',
    })
  } catch (error) {
    console.error('Error updating file:', error)
    const errorMessage = error instanceof Error ? error.message : '更新文件信息时发生错误'
    
    return NextResponse.json<ApiResponse<any>>({
      success: false,
      error: errorMessage,
    }, { status: 500 })
  }
}

