/**
 * 图像编辑API
 * POST /api/image/edit
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { editImage, type ImageEditOptions } from '@/lib/image-editor'
import type { ApiResponse } from '@/types'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
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

    const formData = await request.formData()
    const fileId = formData.get('fileId') as string
    const optionsJson = formData.get('options') as string

    if (!fileId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '缺少fileId参数',
      }, { status: 400 })
    }

    // 获取文件
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    })

    if (!file || file.userId !== decoded.id) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '文件不存在或无权限',
      }, { status: 404 })
    }

    if (file.fileType !== 'image') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '只能编辑图像文件',
      }, { status: 400 })
    }

    // 读取原始文件
    const fs = await import('fs/promises')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'storage', file.storagePath)
    const inputBuffer = await fs.readFile(filePath)

    // 解析编辑选项
    const options: ImageEditOptions = optionsJson ? JSON.parse(optionsJson) : {}

    // 编辑图像
    const result = await editImage(inputBuffer, options)

    // 保存编辑后的图像
    const timestamp = Date.now()
    const newFilename = `${file.id}_edited_${timestamp}.${result.format}`
    const newStoragePath = path.join('images', newFilename)
    const newFilePath = path.join(process.cwd(), 'storage', newStoragePath)

    // 确保目录存在
    await fs.mkdir(path.dirname(newFilePath), { recursive: true })
    await fs.writeFile(newFilePath, result.buffer)

    // 创建新文件记录
    const editedFile = await prisma.file.create({
      data: {
        userId: decoded.id,
        originalFilename: `${file.originalFilename.replace(/\.[^/.]+$/, '')}_edited.${result.format}`,
        filename: newFilename,
        mimeType: `image/${result.format}`,
        fileType: 'image',
        size: result.size,
        md5: '', // TODO: 计算MD5
        storageProvider: 'local',
        storagePath: newStoragePath,
        status: 'ready',
        moderationStatus: 'pending',
        virusScanStatus: 'pending',
      },
    })

    // 更新元数据
    await prisma.fileMetadata.create({
      data: {
        fileId: editedFile.id,
        width: result.width,
        height: result.height,
        aspectRatio: `${result.width}:${result.height}`,
      },
    })

    return NextResponse.json<ApiResponse<{
      fileId: string
      url: string
      width: number
      height: number
      size: number
    }>>({
      success: true,
      data: {
        fileId: editedFile.id,
        url: `/storage/${newStoragePath}`,
        width: result.width,
        height: result.height,
        size: result.size,
      },
    })
  } catch (error) {
    console.error('[Image Edit API] Error:', error)
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

