/**
 * API Route: Chunk Upload (分片上传)
 * 
 * 支持大文件分片上传、断点续传、MD5校验
 * 
 * POST /api/upload/chunk
 * - 初始化上传: { action: 'init', filename, size, mimeType, md5 }
 * - 上传分片: { action: 'upload', fileId, chunkIndex, chunk, chunkMd5 }
 * - 完成上传: { action: 'complete', fileId }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateMD5, calculateChunkMD5, detectFileType, generateUniqueFilename, checkFileSizeLimit } from '@/lib/file-utils'
import { createStorageProvider, getStorageConfig } from '@/lib/storage'
import type { ApiResponse } from '@/types'

const CHUNK_SIZE = 10 * 1024 * 1024 // 10MB per chunk

interface InitRequest {
  action: 'init'
  filename: string
  size: number
  mimeType: string
  md5: string
}

interface UploadChunkRequest {
  action: 'upload'
  fileId: string
  chunkIndex: number
  chunk: string // base64 encoded chunk
  chunkMd5: string
}

interface CompleteRequest {
  action: 'complete'
  fileId: string
}

type ChunkUploadRequest = InitRequest | UploadChunkRequest | CompleteRequest

export async function POST(request: NextRequest) {
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

    const body: ChunkUploadRequest = await request.json()

    // 初始化上传
    if (body.action === 'init') {
      const { filename, size, mimeType, md5 } = body

      // 检测文件类型
      const { fileType } = detectFileType(filename, mimeType)

      // 检查文件大小限制
      const sizeCheck = checkFileSizeLimit(size, fileType)
      if (!sizeCheck.allowed) {
        return NextResponse.json<ApiResponse<any>>({
          success: false,
          error: `文件大小超过限制。最大允许: ${sizeCheck.maxSize / 1024 / 1024}MB`,
        }, { status: 400 })
      }

      // 检查是否已存在相同MD5的文件
      const existingFile = await prisma.file.findUnique({
        where: { md5 },
      })

      if (existingFile && existingFile.userId === user.id) {
        // 如果用户已上传过相同文件，直接返回
        return NextResponse.json<ApiResponse<any>>({
          success: true,
          data: {
            fileId: existingFile.id,
            url: existingFile.storageUrl || `/storage/${existingFile.storagePath}`,
            status: existingFile.status,
            message: '文件已存在',
          },
        })
      }

      // 创建文件记录
      const uniqueFilename = generateUniqueFilename(filename, user.id)
      const file = await prisma.file.create({
        data: {
          userId: user.id,
          originalFilename: filename,
          filename: uniqueFilename,
          mimeType,
          fileType,
          size,
          md5,
          storageProvider: getStorageConfig().provider,
          storagePath: uniqueFilename,
          status: 'uploading',
        },
      })

      // 计算需要的分片数
      const totalChunks = Math.ceil(size / CHUNK_SIZE)

      return NextResponse.json<ApiResponse<any>>({
        success: true,
        data: {
          fileId: file.id,
          totalChunks,
          chunkSize: CHUNK_SIZE,
        },
      })
    }

    // 上传分片
    if (body.action === 'upload') {
      const { fileId, chunkIndex, chunk, chunkMd5 } = body

      // 验证文件存在
      const file = await prisma.file.findUnique({
        where: { id: fileId },
        include: { chunks: true },
      })

      if (!file) {
        return NextResponse.json<ApiResponse<any>>({
          success: false,
          error: '文件不存在',
        }, { status: 404 })
      }

      // 验证用户权限
      if (file.userId !== user.id) {
        return NextResponse.json<ApiResponse<any>>({
          success: false,
          error: '无权访问此文件',
        }, { status: 403 })
      }

      // 检查分片是否已上传
      const existingChunk = file.chunks.find(c => c.chunkIndex === chunkIndex)
      if (existingChunk && existingChunk.uploaded) {
        return NextResponse.json<ApiResponse<any>>({
          success: true,
          data: {
            message: '分片已上传',
            chunkIndex,
          },
        })
      }

      // 解码分片数据
      const chunkBuffer = Buffer.from(chunk, 'base64')
      const actualChunkMd5 = calculateChunkMD5(chunkBuffer)

      // 验证分片MD5
      if (actualChunkMd5 !== chunkMd5) {
        return NextResponse.json<ApiResponse<any>>({
          success: false,
          error: '分片MD5校验失败',
        }, { status: 400 })
      }

      // 保存分片（临时存储，等待合并）
      const tempChunkPath = `temp/${fileId}/${chunkIndex}`
      const storage = createStorageProvider(getStorageConfig())
      await storage.upload(chunkBuffer, tempChunkPath)

      // 更新分片记录
      await prisma.fileChunk.upsert({
        where: {
          fileId_chunkIndex: {
            fileId,
            chunkIndex,
          },
        },
        create: {
          fileId,
          chunkIndex,
          chunkSize: chunkBuffer.length,
          chunkMd5: actualChunkMd5,
          uploaded: true,
          uploadedAt: new Date(),
        },
        update: {
          chunkSize: chunkBuffer.length,
          chunkMd5: actualChunkMd5,
          uploaded: true,
          uploadedAt: new Date(),
        },
      })

      return NextResponse.json<ApiResponse<any>>({
        success: true,
        data: {
          chunkIndex,
          uploaded: true,
        },
      })
    }

    // 完成上传
    if (body.action === 'complete') {
      const { fileId } = body

      const file = await prisma.file.findUnique({
        where: { id: fileId },
        include: { chunks: true },
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
          error: '无权访问此文件',
        }, { status: 403 })
      }

      // 检查所有分片是否已上传
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
      const uploadedChunks = file.chunks.filter(c => c.uploaded).length

      if (uploadedChunks < totalChunks) {
        return NextResponse.json<ApiResponse<any>>({
          success: false,
          error: `还有 ${totalChunks - uploadedChunks} 个分片未上传`,
        }, { status: 400 })
      }

      // 合并分片（这里简化处理，实际应该合并所有分片）
      // 对于本地存储，可以读取所有分片并合并
      // 对于对象存储，可能需要使用multipart upload API

      // 更新文件状态为processing（等待后续处理）
      await prisma.file.update({
        where: { id: fileId },
        data: {
          status: 'processing',
        },
      })

      // 返回文件信息
      return NextResponse.json<ApiResponse<any>>({
        success: true,
        data: {
          fileId: file.id,
          status: 'processing',
          message: '文件上传完成，正在处理...',
        },
      })
    }

    return NextResponse.json<ApiResponse<any>>({
      success: false,
      error: '无效的操作',
    }, { status: 400 })
  } catch (error) {
    console.error('Error in chunk upload:', error)
    const errorMessage = error instanceof Error ? error.message : '上传文件时发生未知错误'
    
    return NextResponse.json<ApiResponse<any>>({
      success: false,
      error: errorMessage,
    }, { status: 500 })
  }
}

