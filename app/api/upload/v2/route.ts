/**
 * API Route: File Upload V2 (完整功能版本)
 * 
 * 支持：
 * - 所有文件类型上传
 * - 自动文件处理（转码、压缩）
 * - 元数据提取
 * - 内容审核
 * - 预览生成
 * - OSS/S3存储
 * 
 * POST /api/upload/v2
 * Body: FormData with file
 * Response: ApiResponse<FileUploadResult>
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  detectFileType,
  calculateMD5,
  generateUniqueFilename,
  checkFileSizeLimit,
  validateMimeType,
} from '@/lib/file-utils'
import { createStorageProvider, getStorageConfig } from '@/lib/storage'
import { extractFileMetadata } from '@/lib/metadata-extractor'
import { moderateContent, getModerationConfig } from '@/lib/content-moderation'
import { generatePreview } from '@/lib/preview-generator'
import { autoProcessFile } from '@/lib/file-processor'
import { retry, isRetryableError } from '@/lib/retry'
import { join } from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import type { ApiResponse } from '@/types'

const MAX_FILE_SIZE_SIMPLE = 100 * 1024 * 1024 // 100MB，超过此大小建议使用分片上传

export interface FileUploadResult {
  fileId: string
  url: string
  previewUrl?: string
  thumbnailUrl?: string
  filename: string
  mimeType: string
  fileType: string
  size: number
  status: string
  metadata?: any
  recommendedModels?: string[]
  taskType?: string
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request)

    if (!token) {
      return NextResponse.json<ApiResponse<FileUploadResult>>({
        success: false,
        error: '未提供认证令牌',
      }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json<ApiResponse<FileUploadResult>>({
        success: false,
        error: '认证令牌无效或已过期',
      }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    })

    if (!user) {
      return NextResponse.json<ApiResponse<FileUploadResult>>({
        success: false,
        error: '用户不存在',
      }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json<ApiResponse<FileUploadResult>>({
        success: false,
        error: '未提供文件',
      }, { status: 400 })
    }

    // 检测文件类型
    const { mimeType, fileType, extension } = detectFileType(file.name, file.type)

    // 验证MIME类型（防止文件伪装）
    if (!validateMimeType(file.name, mimeType)) {
      return NextResponse.json<ApiResponse<FileUploadResult>>({
        success: false,
        error: '文件类型与扩展名不匹配，可能存在安全风险',
      }, { status: 400 })
    }

    // 检查文件大小限制
    const sizeCheck = checkFileSizeLimit(file.size, fileType)
    if (!sizeCheck.allowed) {
      return NextResponse.json<ApiResponse<FileUploadResult>>({
        success: false,
        error: `文件大小超过限制。最大允许: ${Math.round(sizeCheck.maxSize / 1024 / 1024)}MB。建议使用分片上传。`,
      }, { status: 400 })
    }

    // 如果文件太大，建议使用分片上传
    if (file.size > MAX_FILE_SIZE_SIMPLE) {
      return NextResponse.json<ApiResponse<FileUploadResult>>({
        success: false,
        error: `文件过大（${Math.round(file.size / 1024 / 1024)}MB），请使用分片上传 API: /api/upload/chunk`,
      }, { status: 400 })
    }

    // 读取文件内容
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 计算MD5
    const md5 = await calculateMD5(buffer)

    // 检查是否已存在相同文件
    const existingFile = await prisma.file.findUnique({
      where: { md5 },
      include: { metadata: true },
    })

    if (existingFile && existingFile.userId === user.id && existingFile.status === 'ready') {
      // 用户已上传过相同文件，直接返回
      return NextResponse.json<ApiResponse<FileUploadResult>>({
        success: true,
        data: {
          fileId: existingFile.id,
          url: existingFile.storageUrl || `/storage/${existingFile.storagePath}`,
          previewUrl: existingFile.previewUrl || undefined,
          thumbnailUrl: existingFile.thumbnailUrl || undefined,
          filename: existingFile.originalFilename,
          mimeType: existingFile.mimeType,
          fileType: existingFile.fileType,
          size: existingFile.size,
          status: existingFile.status,
          metadata: existingFile.metadata ? {
            image: existingFile.metadata.width ? {
              width: existingFile.metadata.width,
              height: existingFile.metadata.height,
              aspectRatio: existingFile.metadata.aspectRatio,
            } : undefined,
            video: existingFile.metadata.duration ? {
              duration: existingFile.metadata.duration,
              width: existingFile.metadata.width,
              height: existingFile.metadata.height,
            } : undefined,
          } : undefined,
        },
        message: '文件已存在',
      })
    }

    // 计算文件上传所需的积分（根据文件大小和类型）
    // 小文件（<10MB）免费，大文件按大小收费
    const calculateUploadCredits = (fileSize: number, fileType: string): number => {
      const sizeMB = fileSize / (1024 * 1024)
      
      // 小文件免费
      if (sizeMB < 10) {
        return 0
      }
      
      // 大文件按大小收费：每10MB = 1积分，最低1积分
      if (sizeMB >= 10) {
        return Math.max(1, Math.ceil(sizeMB / 10))
      }
      
      return 0
    }

    const creditsNeeded = calculateUploadCredits(file.size, fileType)

    // 检查用户积分是否足够
    if (creditsNeeded > 0 && user.credits < creditsNeeded) {
      return NextResponse.json<ApiResponse<FileUploadResult>>({
        success: false,
        error: `积分不足。上传此文件需要 ${creditsNeeded} 个积分，当前有 ${user.credits} 个`,
      }, { status: 400 })
    }

    // 生成唯一文件名
    const uniqueFilename = generateUniqueFilename(file.name, user.id)
    const storageConfig = getStorageConfig()
    const storage = createStorageProvider(storageConfig)

    // 临时保存文件（用于处理）
    const tempDir = join(process.cwd(), 'temp', 'uploads', user.id)
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true })
    }
    const tempPath = join(tempDir, `${Date.now()}-${file.name}`)
    await writeFile(tempPath, buffer)

    // 创建文件记录
    const fileRecord = await prisma.file.create({
      data: {
        userId: user.id,
        originalFilename: file.name,
        filename: uniqueFilename,
        mimeType,
        fileType,
        size: file.size,
        md5,
        storageProvider: storageConfig.provider,
        storagePath: uniqueFilename,
        status: 'processing',
      },
    })

    try {
      // 1. 内容审核（异步进行，不阻塞上传）
      const moderationConfig = getModerationConfig()
      const moderationResult = await moderateContent(
        fileType === 'image' ? 'image' : fileType === 'video' ? 'video' : 'text',
        fileType === 'text' ? buffer.toString('utf-8').substring(0, 1000) : tempPath,
        moderationConfig
      )

      if (!moderationResult.passed) {
        await prisma.file.update({
          where: { id: fileRecord.id },
          data: {
            status: 'failed',
            moderationStatus: 'rejected',
            moderationReason: moderationResult.reason || '内容审核未通过',
          },
        })

        return NextResponse.json<ApiResponse<FileUploadResult>>({
          success: false,
          error: moderationResult.reason || '内容审核未通过',
        }, { status: 403 })
      }

      // 更新审核状态并记录审核结果
      await prisma.file.update({
        where: { id: fileRecord.id },
        data: {
          moderationStatus: moderationResult.riskLevel === 'pass' ? 'approved' : 'pending',
          moderationReason: moderationResult.reason || null,
        },
      })

      // 记录审核日志（使用console.log，生产环境可以写入日志系统）
      console.log(`[Content Moderation] File ${fileRecord.id}:`, {
        fileId: fileRecord.id,
        filename: file.originalFilename,
        fileType,
        riskLevel: moderationResult.riskLevel,
        passed: moderationResult.passed,
        categories: moderationResult.categories,
        score: moderationResult.score,
        reason: moderationResult.reason,
        timestamp: new Date().toISOString(),
      })

      // 2. 文件处理（转码、压缩）
      let processedPath = tempPath
      let processedSize = file.size
      try {
        if (['image', 'video', 'audio'].includes(fileType)) {
          const outputPath = join(tempDir, `processed-${Date.now()}.${extension}`)
          const processResult = await autoProcessFile(tempPath, outputPath, fileType, {
            imageMaxWidth: 4096,
            imageMaxHeight: 4096,
            imageQuality: 85,
          })

          if (processResult.processed && processResult.outputPath) {
            processedPath = processResult.outputPath
            processedSize = processResult.outputSize || file.size
            console.log(`[File Processing] File ${fileRecord.id} processed:`, {
              originalSize: file.size,
              processedSize,
              compressionRatio: processResult.compressionRatio,
            })
          } else {
            console.warn(`[File Processing] File ${fileRecord.id} processing skipped or failed`)
          }
        }
      } catch (processError) {
        console.error(`[File Processing] Error processing file ${fileRecord.id}:`, processError)
        // 继续使用原始文件，不阻塞上传流程
      }

      // 3. 上传到对象存储（带重试）
      const processedBuffer = await import('fs').then(fs => fs.promises.readFile(processedPath))
      const uploadResult = await retry(
        () => storage.upload(processedBuffer, uniqueFilename),
        {
          maxRetries: 3,
          retryDelay: 2000,
          exponentialBackoff: true,
          onRetry: (attempt, error) => {
            console.warn(`[File Upload] Storage upload retry ${attempt}/3:`, error.message)
          },
        }
      )

      // 4. 提取元数据（带重试）
      let metadata: any = {}
      try {
        metadata = await retry(
          () => extractFileMetadata(processedPath, fileType, mimeType),
          {
            maxRetries: 2,
            retryDelay: 1000,
            exponentialBackoff: false,
            onRetry: (attempt, error) => {
              console.warn(`[Metadata Extraction] Retry ${attempt}/2:`, error.message)
            },
          }
        )
        console.log(`[Metadata Extraction] File ${fileRecord.id} metadata extracted:`, {
          fileType,
          hasImageMetadata: !!metadata.image,
          hasVideoMetadata: !!metadata.video,
          hasAudioMetadata: !!metadata.audio,
          hasDocumentMetadata: !!metadata.document,
          hasCodeMetadata: !!metadata.code,
        })
      } catch (metadataError) {
        console.error(`[Metadata Extraction] Error extracting metadata for file ${fileRecord.id}:`, metadataError)
        // 继续流程，使用空元数据
      }

      // 保存元数据
      if (metadata.image || metadata.video || metadata.audio || metadata.document || metadata.code) {
        await prisma.fileMetadata.create({
          data: {
            fileId: fileRecord.id,
            width: metadata.image?.width || metadata.video?.width,
            height: metadata.image?.height || metadata.video?.height,
            aspectRatio: metadata.image?.aspectRatio,
            colorMode: metadata.image?.colorMode,
            duration: metadata.video?.duration || metadata.audio?.duration,
            bitrate: metadata.video?.bitrate || metadata.audio?.bitrate,
            codec: metadata.video?.codec || metadata.audio?.codec,
            fps: metadata.video?.fps,
            sampleRate: metadata.audio?.sampleRate,
            channels: metadata.audio?.channels,
            pageCount: metadata.document?.pageCount,
            wordCount: metadata.document?.wordCount,
            language: metadata.document?.language,
            extractedText: metadata.document?.extractedText?.substring(0, 10000), // 限制长度
            programmingLanguage: metadata.code?.programmingLanguage,
            linesOfCode: metadata.code?.linesOfCode,
            dependencies: metadata.code?.dependencies ? JSON.stringify(metadata.code.dependencies) : null,
            extraMetadata: metadata.extra ? JSON.stringify(metadata.extra) : null,
          },
        })
      }

      // 5. 生成预览
      let previewUrl: string | null = null
      let thumbnailUrl: string | null = null

      try {
        if (fileType === 'image') {
          const thumbnailPath = join(tempDir, `thumb-${Date.now()}.jpg`)
          thumbnailUrl = await generatePreview(processedPath, fileType, thumbnailPath, {
            thumbnailWidth: 300,
            thumbnailHeight: 300,
          })
          if (thumbnailUrl) {
            const thumbBuffer = await import('fs').then(fs => fs.promises.readFile(thumbnailUrl!))
            const thumbUpload = await storage.upload(thumbBuffer, `thumbnails/${uniqueFilename}`)
            thumbnailUrl = thumbUpload.url
            console.log(`[Preview Generation] Thumbnail generated for file ${fileRecord.id}`)
          }
        } else if (fileType === 'video') {
          const coverPath = join(tempDir, `cover-${Date.now()}.jpg`)
          previewUrl = await generatePreview(processedPath, fileType, coverPath, {
            videoCoverWidth: 640,
            videoCoverHeight: 360,
          })
          if (previewUrl) {
            const coverBuffer = await import('fs').then(fs => fs.promises.readFile(previewUrl!))
            const coverUpload = await storage.upload(coverBuffer, `covers/${uniqueFilename}`)
            previewUrl = coverUpload.url
            console.log(`[Preview Generation] Video cover generated for file ${fileRecord.id}`)
          }
        }
      } catch (previewError) {
        console.error(`[Preview Generation] Error generating preview for file ${fileRecord.id}:`, previewError)
        // 继续流程，预览生成失败不影响文件上传
      }

      // 6. 生成AI模型推荐
      const { recommendedModels, taskType } = getRecommendedModels(fileType, metadata)

      // 扣除用户积分（如果需要）
      if (creditsNeeded > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            credits: {
              decrement: creditsNeeded,
            },
          },
        })
        console.log(`[Credits] User ${user.id} deducted ${creditsNeeded} credits for file upload`)
      }

      // 7. 更新文件记录
      await prisma.file.update({
        where: { id: fileRecord.id },
        data: {
          status: 'ready',
          storageUrl: uploadResult.url,
          previewUrl: previewUrl || null,
          thumbnailUrl: thumbnailUrl || null,
          size: processedSize,
          creditsUsed: creditsNeeded,
        },
      })

      // 8. 清理临时文件
      try {
        await import('fs').then(fs => fs.promises.unlink(tempPath))
        if (processedPath !== tempPath) {
          await import('fs').then(fs => fs.promises.unlink(processedPath))
        }
        if (thumbnailUrl) {
          await import('fs').then(fs => fs.promises.unlink(thumbnailUrl!))
        }
        if (previewUrl && fileType === 'video') {
          await import('fs').then(fs => fs.promises.unlink(previewUrl!))
        }
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp files:', cleanupError)
      }

      return NextResponse.json<ApiResponse<FileUploadResult>>({
        success: true,
        data: {
          fileId: fileRecord.id,
          url: uploadResult.url,
          previewUrl: previewUrl || undefined,
          thumbnailUrl: thumbnailUrl || undefined,
          filename: file.name,
          mimeType,
          fileType,
          size: processedSize,
          status: 'ready',
          metadata: {
            image: metadata.image,
            video: metadata.video,
            audio: metadata.audio,
            document: metadata.document,
            code: metadata.code,
          },
          recommendedModels,
          taskType,
        },
      })
    } catch (processingError) {
      console.error('Error processing file:', processingError)
      
      // 如果已经扣除了积分，需要退回
      if (creditsNeeded > 0) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              credits: {
                increment: creditsNeeded,
              },
            },
          })
          console.log(`[Credits] Refunded ${creditsNeeded} credits to user ${user.id} due to upload failure`)
        } catch (refundError) {
          console.error('Failed to refund credits:', refundError)
        }
      }
      
      // 更新文件状态为失败
      await prisma.file.update({
        where: { id: fileRecord.id },
        data: {
          status: 'failed',
        },
      })

      throw processingError
    }
  } catch (error) {
    console.error('Error uploading file:', error)
    const errorMessage = error instanceof Error ? error.message : '上传文件时发生未知错误'
    
    return NextResponse.json<ApiResponse<FileUploadResult>>({
      success: false,
      error: errorMessage,
    }, { status: 500 })
  }
}

/**
 * 根据文件类型和元数据推荐AI模型
 */
function getRecommendedModels(fileType: string, metadata: any): {
  recommendedModels: string[]
  taskType?: string
} {
  const models: string[] = []
  let taskType: string | undefined

  switch (fileType) {
    case 'image':
      taskType = 'image-editing'
      models.push('gemini-2.5-pro', 'dall-e-3', 'midjourney', 'stable-diffusion')
      break
    case 'video':
      taskType = 'video-editing'
      models.push('runway', 'pika', 'luma', 'stability-ai')
      break
    case 'audio':
      taskType = 'audio-processing'
      models.push('elevenlabs', 'whisper', 'musicgen')
      break
    case 'document':
      taskType = 'document-analysis'
      models.push('gpt-4', 'claude', 'gemini-2.5-pro')
      break
    case 'code':
      taskType = 'code-analysis'
      models.push('gpt-4', 'claude', 'github-copilot')
      break
    default:
      taskType = 'general'
      models.push('gpt-4', 'claude', 'gemini-2.5-pro')
  }

  return { recommendedModels: models, taskType }
}

