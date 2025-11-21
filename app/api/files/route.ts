/**
 * API Route: File Management
 * 
 * GET /api/files - 获取用户文件列表
 * DELETE /api/files/[fileId] - 删除文件
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createStorageProvider, getStorageConfig } from '@/lib/storage'
import type { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const fileType = searchParams.get('fileType')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // 构建查询条件
    const where: any = {
      userId: user.id,
    }

    if (fileType) {
      where.fileType = fileType
    }

    if (status) {
      where.status = status
    }

    // 查询文件
    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        include: {
          metadata: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.file.count({ where }),
    ])

    console.log(`[File Management] User ${user.id} fetched ${files.length} files (page ${page}/${Math.ceil(total / limit)})`)

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: {
        files: files.map(file => ({
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
          createdAt: file.createdAt,
          metadata: file.metadata ? {
            width: file.metadata.width,
            height: file.metadata.height,
            duration: file.metadata.duration,
          } : null,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Error fetching files:', error)
    const errorMessage = error instanceof Error ? error.message : '获取文件列表时发生错误'
    
    return NextResponse.json<ApiResponse<any>>({
      success: false,
      error: errorMessage,
    }, { status: 500 })
  }
}

