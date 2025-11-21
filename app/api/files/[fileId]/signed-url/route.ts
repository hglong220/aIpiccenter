/**
 * API Route: Generate Signed URL
 * 
 * 生成文件的临时访问链接（带过期时间）
 * 
 * POST /api/files/[fileId]/signed-url
 * Body: { expiresIn?: number, maxAccess?: number }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createStorageProvider, getStorageConfig } from '@/lib/storage'
import type { ApiResponse } from '@/types'
import crypto from 'crypto'

export async function POST(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const token = getTokenFromCookies(request)

    if (!token) {
      return NextResponse.json<ApiResponse<{ url: string; expiresAt: string }>>({
        success: false,
        error: '未提供认证令牌',
      }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json<ApiResponse<{ url: string; expiresAt: string }>>({
        success: false,
        error: '认证令牌无效或已过期',
      }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    })

    if (!user) {
      return NextResponse.json<ApiResponse<{ url: string; expiresAt: string }>>({
        success: false,
        error: '用户不存在',
      }, { status: 404 })
    }

    const fileId = params.fileId
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    })

    if (!file) {
      return NextResponse.json<ApiResponse<{ url: string; expiresAt: string }>>({
        success: false,
        error: '文件不存在',
      }, { status: 404 })
    }

    // 检查权限（私有文件只能所有者访问）
    if (file.accessLevel === 'private' && file.userId !== user.id) {
      return NextResponse.json<ApiResponse<{ url: string; expiresAt: string }>>({
        success: false,
        error: '无权访问此文件',
      }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const expiresIn = body.expiresIn || 3600 // 默认1小时
    const maxAccess = body.maxAccess || null

    // 生成签名URL
    const storage = createStorageProvider(getStorageConfig())
    const signedUrl = await storage.getSignedUrl(file.storagePath, {
      expiresIn,
      maxAccess,
    })

    // 生成token用于数据库记录
    const tokenStr = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + expiresIn * 1000)

    // 保存签名URL记录
    await prisma.signedUrl.create({
      data: {
        fileId: file.id,
        token: tokenStr,
        url: signedUrl,
        expiresAt,
        maxAccess,
      },
    })

    return NextResponse.json<ApiResponse<{ url: string; expiresAt: string }>>({
      success: true,
      data: {
        url: signedUrl,
        expiresAt: expiresAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Error generating signed URL:', error)
    const errorMessage = error instanceof Error ? error.message : '生成签名URL时发生错误'
    
    return NextResponse.json<ApiResponse<{ url: string; expiresAt: string }>>({
      success: false,
      error: errorMessage,
    }, { status: 500 })
  }
}

