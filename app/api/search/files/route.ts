/**
 * 文件搜索API
 * GET /api/search/files?q=query&type=image&limit=20
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

const MAX_RESULTS = 50

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request)
    if (!token) {
      return NextResponse.json(
        { success: false, error: '未登录' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: '认证失效，请重新登录' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')?.trim()
    const fileType = searchParams.get('type') // image, video, audio, document, etc.
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), MAX_RESULTS)

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: {
          results: [],
          total: 0,
        },
      })
    }

    // 构建查询条件
    const where: any = {
      userId: decoded.id,
      status: 'ready',
    }

    if (fileType) {
      where.fileType = fileType
    }

    // 搜索文件名和元数据
    const files = await prisma.file.findMany({
      where: {
        ...where,
        OR: [
          { originalFilename: { contains: query, mode: 'insensitive' } },
          { filename: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        metadata: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    // 如果文件名搜索没有结果，尝试搜索元数据中的文本
    if (files.length === 0) {
      const filesByMetadata = await prisma.file.findMany({
        where: {
          ...where,
          metadata: {
            extractedText: {
              contains: query,
              mode: 'insensitive',
            },
          },
        },
        include: {
          metadata: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      })
      files.push(...filesByMetadata)
    }

    const results = files.map((file) => ({
      id: file.id,
      filename: file.originalFilename,
      fileType: file.fileType,
      mimeType: file.mimeType,
      size: file.size,
      storageUrl: file.storageUrl,
      previewUrl: file.previewUrl,
      thumbnailUrl: file.thumbnailUrl,
      createdAt: file.createdAt.toISOString(),
      metadata: file.metadata ? {
        width: file.metadata.width,
        height: file.metadata.height,
        duration: file.metadata.duration,
        extractedText: file.metadata.extractedText?.substring(0, 200),
      } : null,
    }))

    return NextResponse.json({
      success: true,
      data: {
        results,
        total: results.length,
      },
    })
  } catch (error) {
    console.error('文件搜索失败:', error)
    return NextResponse.json(
      { success: false, error: '服务器异常，请稍后再试' },
      { status: 500 }
    )
  }
}

