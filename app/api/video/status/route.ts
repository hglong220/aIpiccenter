/**
 * 视频生成状态查询API
 * 
 * GET /api/video/status?taskId=xxx
 * Response: { taskId, status, progress, result, error }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAIRouter } from '@/lib/ai-router'
import type { ApiResponse } from '@/types'
import * as path from 'path'

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
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

    // 获取任务ID
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '缺少taskId参数',
      }, { status: 400 })
    }

    // 从数据库获取任务
    const dbTask = await prisma.aITask.findUnique({
      where: { id: taskId },
    })

    if (!dbTask) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '任务不存在',
      }, { status: 404 })
    }

    // 验证任务属于当前用户
    if (dbTask.userId !== decoded.id) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '无权访问此任务',
      }, { status: 403 })
    }

    // 如果任务正在运行，查询外部 API 状态
    let status = dbTask.status
    let progress = dbTask.progress
    let result = dbTask.resultData ? JSON.parse(dbTask.resultData) : null
    let error = dbTask.error

    if (status === 'running' && dbTask.model) {
      try {
        // 从结果中获取 generationId
        const resultData = dbTask.resultData ? JSON.parse(dbTask.resultData) : null
        const generationId = resultData?.id

        if (generationId) {
          // 查询外部 API 状态
          const apiStatus = await queryVideoGenerationStatus(dbTask.model, generationId)
          
          if (apiStatus.status === 'completed' || apiStatus.status === 'success') {
            status = 'success'
            progress = 100
            
            // 下载并存储视频
            let storedVideoUrl = apiStatus.videoUrl
            let storedThumbnailUrl = apiStatus.thumbnailUrl
            
            if (apiStatus.videoUrl && process.env.VIDEO_STORAGE_ENABLED === 'true') {
              try {
                const { saveVideoToStorage } = await import('@/lib/video-processor')
                const storagePath = process.env.STORAGE_PATH || path.join(process.cwd(), 'storage')
                const storageResult = await saveVideoToStorage(
                  apiStatus.videoUrl,
                  decoded.id,
                  storagePath
                )
                
                // 更新文件记录（如果存在）
                storedVideoUrl = `/storage/${decoded.id}/videos/${path.basename(storageResult.localPath)}`
                storedThumbnailUrl = `/storage/${decoded.id}/videos/${path.basename(storageResult.thumbnailPath)}`
              } catch (storageError) {
                console.error('[Video Status] Video storage failed:', storageError)
                // 继续使用原始URL
              }
            }
            
            result = {
              videoUrl: storedVideoUrl,
              thumbnailUrl: storedThumbnailUrl,
            }
            
            // 更新数据库
            await prisma.aiTask.update({
              where: { id: taskId },
              data: {
                status: 'success',
                resultData: JSON.stringify(result),
                progress: 100,
                completedAt: new Date(),
              },
            })
          } else if (apiStatus.status === 'failed' || apiStatus.status === 'error') {
            status = 'failed'
            error = apiStatus.error || '视频生成失败'
            
            await prisma.aiTask.update({
              where: { id: taskId },
              data: {
                status: 'failed',
                error,
                completedAt: new Date(),
              },
            })
          } else {
            progress = apiStatus.progress || dbTask.progress
          }
        }
      } catch (err: any) {
        console.error('[Video Status] Error querying external API:', err)
        // 继续使用数据库状态
      }
    }

    // 如果任务完成，更新数据库
    if (status === 'success' && dbTask.status !== 'success') {
      await prisma.aITask.update({
        where: { id: taskId },
        data: {
          status: 'success',
          resultData: result ? JSON.stringify(result) : null,
          progress: 100,
          completedAt: new Date(),
        },
      })

      // 创建生成记录
      if (result?.videoUrl) {
        await prisma.generation.create({
          data: {
            userId: decoded.id,
            type: 'video',
            prompt: JSON.parse(dbTask.requestData).prompt,
            videoUrl: result.videoUrl,
            model: dbTask.model || undefined,
            creditsUsed: 10,
            status: 'success',
          },
        })
      }
    } else if (status === 'failed' && dbTask.status !== 'failed') {
      await prisma.aITask.update({
        where: { id: taskId },
        data: {
          status: 'failed',
          error: error || '任务失败',
          completedAt: new Date(),
        },
      })

      // 退回积分
      await prisma.user.update({
        where: { id: decoded.id },
        data: {
          credits: {
            increment: 10,
          },
        },
      })
    }

    return NextResponse.json<ApiResponse<{
      taskId: string
      status: string
      progress: number
      result?: any
      error?: string
      estimatedTime?: number
      createdAt: string
      completedAt?: string
    }>>({
      success: true,
      data: {
        taskId: dbTask.id,
        status,
        progress,
        result,
        error,
        estimatedTime: dbTask.estimatedTime || undefined,
        createdAt: dbTask.createdAt.toISOString(),
        completedAt: dbTask.completedAt?.toISOString(),
      },
    })
  } catch (error) {
    console.error('[Video Status API] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: errorMessage,
    }, { status: 500 })
  }
}

/**
 * 查询视频生成状态（从外部 API）
 */
async function queryVideoGenerationStatus(
  model: string,
  generationId: string
): Promise<{ status: string; progress?: number; videoUrl?: string; thumbnailUrl?: string; error?: string }> {
  // 获取 API Key
  const apiKey = getApiKeyForModel(model)
  if (!apiKey) {
    throw new Error(`No API key configured for model ${model}`)
  }

  switch (model) {
    case 'runway':
      const { getRunwayGenerationStatus } = await import('@/lib/video-generators/runway')
      return await getRunwayGenerationStatus({ apiKey }, generationId)
    case 'pika':
      const { getPikaGenerationStatus } = await import('@/lib/video-generators/pika')
      return await getPikaGenerationStatus({ apiKey }, generationId)
    case 'kling':
      const { getKlingGenerationStatus } = await import('@/lib/video-generators/kling')
      return await getKlingGenerationStatus({ apiKey }, generationId)
    default:
      throw new Error(`Unsupported model: ${model}`)
  }
}

function getApiKeyForModel(model: string): string | null {
  switch (model) {
    case 'runway':
      return process.env.RUNWAY_API_KEY?.split(',')[0] || null
    case 'pika':
      return process.env.PIKA_API_KEY?.split(',')[0] || null
    case 'kling':
      return process.env.KLING_API_KEY?.split(',')[0] || null
    default:
      return null
  }
}

