/**
 * BullMQ Queue Workers
 * 
 * Workers process jobs from queues:
 * - aiWorker: Processes AI generation tasks
 * - videoWorker: Processes video generation tasks
 * - uploadWorker: Processes file upload tasks
 */

import { Worker, Job } from 'bullmq'
import { redis } from './redis'
import { aiQueue, videoQueue, uploadProcessingQueue } from './queues'
import { prisma } from './prisma'
import { getAPIKeyManager, ModelRecommender } from './ai-scheduler'
import { getAIRouter } from './ai-router'
import type { ModelType } from './ai-router'

// Worker options
const workerOptions = {
  connection: redis,
  concurrency: 5, // Process 5 jobs concurrently
  limiter: {
    max: 10, // Max 10 jobs
    duration: 1000, // Per second
  },
}

// AI Generation Worker (with fallback support)
export const aiWorker = new Worker(
  'ai-generation',
  async (job: Job) => {
    const { taskId, userId, taskType, request, model, fallbackModels } = job.data

    console.log(`[AI Worker] Processing task ${taskId} (${taskType}) with model ${model}`)

    // Update task status to running
    await prisma.aiTask.update({
      where: { id: taskId },
      data: {
        status: 'running',
        startedAt: new Date(),
        progress: 10,
      },
    })

    const apiKeyManager = getAPIKeyManager()
    const router = getAIRouter()
    let currentModel: ModelType = model
    const modelsToTry = [model, ...(fallbackModels || [])]
    let lastError: Error | null = null

    // Try primary model and fallbacks
    for (let i = 0; i < modelsToTry.length; i++) {
      currentModel = modelsToTry[i]
      
      try {
        // Get API key using Key Manager
        const modelConfig = router['modelManager'].getModel(currentModel)
        if (!modelConfig || !modelConfig.enabled) {
          throw new Error(`Model ${currentModel} is not available`)
        }

        const apiKey = apiKeyManager.getNextKey(currentModel, modelConfig.apiKeys)
        if (!apiKey) {
          throw new Error(`No API key available for model ${currentModel}`)
        }

        // Update task with current model
        if (i > 0) {
          await prisma.aiTask.update({
            where: { id: taskId },
            data: {
              model: currentModel,
              retryCount: i,
            },
          })
        }

        // Process based on task type
        let result: any

        switch (taskType) {
          case 'text':
            result = await processTextTask(request, currentModel, apiKey)
            break
          case 'image':
            result = await processImageTask(request, currentModel, apiKey)
            break
          case 'document':
            result = await processDocumentTask(request, currentModel, apiKey)
            break
          case 'code':
            result = await processCodeTask(request, currentModel, apiKey)
            break
          default:
            throw new Error(`Unsupported task type: ${taskType}`)
        }

        // Record success
        apiKeyManager.recordSuccess(currentModel, apiKey)

        // Update task status to success
        await prisma.aiTask.update({
          where: { id: taskId },
          data: {
            status: 'success',
            resultData: JSON.stringify(result),
            progress: 100,
            completedAt: new Date(),
            model: currentModel,
          },
        })

        return result
      } catch (error: any) {
        lastError = error
        
        // Record failure
        const modelConfigForFailure = router['modelManager'].getModel(currentModel)
        if (modelConfigForFailure) {
          const apiKey = apiKeyManager.getNextKey(currentModel, modelConfigForFailure.apiKeys)
          if (apiKey) {
            apiKeyManager.recordFailure(currentModel, apiKey, error.message)
          }
        }

        console.warn(`[AI Worker] Model ${currentModel} failed, trying fallback...`, error.message)

        // If this is the last model, fail the task
        if (i === modelsToTry.length - 1) {
          await prisma.aiTask.update({
            where: { id: taskId },
            data: {
              status: 'failed',
              error: `All models failed. Last error: ${error.message}`,
              completedAt: new Date(),
            },
          })
          throw error
        }

        // Continue to next fallback model
        continue
      }
    }

    // Should not reach here, but just in case
    throw lastError || new Error('Task processing failed')
  },
  workerOptions
)

// Video Generation Worker (with fallback support)
export const videoWorker = new Worker(
  'video-generation',
  async (job: Job) => {
    const { taskId, userId, request, model, fallbackModels } = job.data

    console.log(`[Video Worker] Processing task ${taskId} with model ${model}`)

    // Update task status
    await prisma.aiTask.update({
      where: { id: taskId },
      data: {
        status: 'running',
        startedAt: new Date(),
        progress: 10,
      },
    })

    const apiKeyManager = getAPIKeyManager()
    const router = getAIRouter()
    let currentModel: ModelType = model
    const modelsToTry = [model, ...(fallbackModels || [])]
    let lastError: Error | null = null

    // Try primary model and fallbacks
    for (let i = 0; i < modelsToTry.length; i++) {
      currentModel = modelsToTry[i]
      
      try {
        const modelConfig = router['modelManager'].getModel(currentModel)
        if (!modelConfig || !modelConfig.enabled) {
          throw new Error(`Model ${currentModel} is not available`)
        }

        const apiKey = apiKeyManager.getNextKey(currentModel, modelConfig.apiKeys)
        if (!apiKey) {
          throw new Error(`No API key available for model ${currentModel}`)
        }

        if (i > 0) {
          await prisma.aiTask.update({
            where: { id: taskId },
            data: {
              model: currentModel,
              retryCount: i,
            },
          })
        }

        const result = await processVideoTask(request, currentModel, apiKey)
        
        // 处理视频文件（下载、转码、生成封面）
        const storagePath = process.env.STORAGE_LOCAL_PATH || './storage'
        const { saveVideoToStorage } = await import('./video-processor')
        
        let savedVideo: any = null
        if (result.videoUrl) {
          try {
            savedVideo = await saveVideoToStorage(
              result.videoUrl,
              userId,
              storagePath
            )
          } catch (error: any) {
            console.warn('[Video Worker] Failed to save video to storage:', error)
            // 继续使用原始 URL
          }
        }
        
        apiKeyManager.recordSuccess(currentModel, apiKey)
        
        // 更新任务状态
        const finalResult = {
          ...result,
          localPath: savedVideo?.localPath,
          thumbnailPath: savedVideo?.thumbnailPath,
          metadata: savedVideo?.metadata,
        }
        
        await prisma.aiTask.update({
          where: { id: taskId },
          data: {
            status: 'success',
            resultData: JSON.stringify(finalResult),
            progress: 100,
            completedAt: new Date(),
            model: currentModel,
          },
        })

        // 创建生成记录
        const requestData = JSON.parse((await prisma.aiTask.findUnique({ where: { id: taskId } }))!.requestData)
        await prisma.generation.create({
          data: {
            userId,
            type: 'video',
            prompt: requestData.prompt,
            videoUrl: result.videoUrl,
            model: currentModel,
            creditsUsed: 10,
            status: 'success',
          },
        })

        return finalResult
      } catch (error: any) {
        lastError = error
        const modelConfig = router['modelManager'].getModel(currentModel)
        if (modelConfig) {
          const apiKey = apiKeyManager.getNextKey(currentModel, modelConfig.apiKeys)
          if (apiKey) {
            apiKeyManager.recordFailure(currentModel, apiKey, error.message)
          }
        }

        console.warn(`[Video Worker] Model ${currentModel} failed, trying fallback...`, error.message)

        if (i === modelsToTry.length - 1) {
          await prisma.aiTask.update({
            where: { id: taskId },
            data: {
              status: 'failed',
              error: `All models failed. Last error: ${error.message}`,
              completedAt: new Date(),
            },
          })
          throw error
        }

        continue
      }
    }

    throw lastError || new Error('Video generation failed')
  },
  {
    ...workerOptions,
    concurrency: 2, // Lower concurrency for video (more resource intensive)
  }
)

// Upload Processing Worker
export const uploadWorker = new Worker(
  'upload-processing',
  async (job: Job) => {
    const { fileId, userId } = job.data

    console.log(`[Upload Worker] Processing file ${fileId}`)

    // Update file status
    await prisma.file.update({
      where: { id: fileId },
      data: {
        status: 'processing',
      },
    })

    try {
      // Process file (extract metadata, generate thumbnails, etc.)
      await processFileUpload(fileId)

      // Update file status
      await prisma.file.update({
        where: { id: fileId },
        data: {
          status: 'ready',
        },
      })
    } catch (error: any) {
      await prisma.file.update({
        where: { id: fileId },
        data: {
          status: 'failed',
        },
      })

      throw error
    }
  },
  {
    ...workerOptions,
    concurrency: 10, // Higher concurrency for uploads
  }
)

// Task processors (implementations)
async function processTextTask(request: any, model: ModelType, apiKey: string): Promise<any> {
  // Use router's executeGeminiTask or executeGPTTask
  const router = getAIRouter()
  const task = {
    id: 'temp',
    userId: 'temp',
    type: 'text' as const,
    priority: 'normal' as const,
    status: 'running' as const,
    model,
    request,
    retryCount: 0,
    maxRetries: 3,
    createdAt: new Date(),
  }

  if (model === 'gemini-pro' || model === 'gemini-flash') {
    return await router['executeGeminiTask'](task, apiKey)
  } else if (model === 'gpt-4' || model === 'gpt-3.5') {
    return await router['executeGPTTask'](task, apiKey)
  }
  
  throw new Error(`Text generation not implemented for model ${model}`)
}

async function processImageTask(request: any, model: ModelType, apiKey: string): Promise<any> {
  const router = getAIRouter()
  const task = {
    id: 'temp',
    userId: 'temp',
    type: 'image' as const,
    priority: 'normal' as const,
    status: 'running' as const,
    model,
    request,
    retryCount: 0,
    maxRetries: 3,
    createdAt: new Date(),
  }

  if (model === 'gemini-pro' || model === 'gemini-flash') {
    return await router['executeGeminiTask'](task, apiKey)
  } else if (model === 'stable-diffusion' || model === 'flux') {
    return await router['executeImageGenerationTask'](task, apiKey)
  }
  
  throw new Error(`Image generation not implemented for model ${model}`)
}

async function processDocumentTask(request: any, model: ModelType, apiKey: string): Promise<any> {
  // Document processing can use text models or OCR
  if (model === 'ocr') {
    try {
      const { imagePath, imageUrl, language } = request
      
      // 使用Tesseract OCR
      const { recognizeText } = await import('@/lib/ocr/tesseract')
      
      let imagePathToUse = imagePath
      if (!imagePathToUse && imageUrl) {
        // 下载图片到临时文件
        const fs = await import('fs/promises')
        const path = await import('path')
        const response = await fetch(imageUrl)
        const buffer = Buffer.from(await response.arrayBuffer())
        const tempDir = path.join(process.cwd(), 'temp', 'ocr')
        await fs.mkdir(tempDir, { recursive: true })
        imagePathToUse = path.join(tempDir, `ocr_${Date.now()}.jpg`)
        await fs.writeFile(imagePathToUse, buffer)
      }
      
      if (!imagePathToUse) {
        throw new Error('缺少图像路径或URL')
      }
      
      const result = await recognizeText(imagePathToUse, language || 'chi_sim+eng')
      
      // 清理临时文件
      if (imageUrl && imagePathToUse) {
        try {
          const fs = await import('fs/promises')
          await fs.unlink(imagePathToUse)
        } catch (e) {
          // 忽略清理错误
        }
      }
      
      return {
        text: result.text,
        confidence: result.confidence,
        words: result.words,
      }
    } catch (error: any) {
      console.error('[OCR Task] Error:', error)
      throw new Error(`OCR处理失败: ${error.message}`)
    }
  }
  
  // Use text model for document processing
  return await processTextTask(request, model, apiKey)
}

async function processCodeTask(request: any, model: ModelType, apiKey: string): Promise<any> {
  // Code analysis uses text models
  return await processTextTask(request, model, apiKey)
}

async function processVideoTask(request: any, model: ModelType, apiKey: string): Promise<any> {
    const router = getAIRouter()
    const task = {
      id: 'temp',
      userId: 'temp',
      type: 'video' as const,
      priority: 'normal' as const,
      status: 'running' as const,
      model,
      request,
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date(),
    }

    // 创建视频生成任务
    const generationResult = await router['executeVideoGenerationTask'](task, apiKey)
    
    // 轮询直到完成
    const finalResult = await pollVideoGenerationStatus(model, apiKey, generationResult.id)
    
    return finalResult
  }

/**
 * 轮询视频生成状态
 */
async function pollVideoGenerationStatus(
  model: ModelType,
  apiKey: string,
  generationId: string,
  maxWait: number = 300000 // 5分钟
): Promise<any> {
  const startTime = Date.now()
  const pollInterval = 5000 // 5秒轮询一次

  while (Date.now() - startTime < maxWait) {
    try {
      let status: any

      switch (model) {
        case 'runway':
          const { getRunwayGenerationStatus } = await import('./video-generators/runway')
          status = await getRunwayGenerationStatus({ apiKey }, generationId)
          break
        case 'pika':
          const { getPikaGenerationStatus } = await import('./video-generators/pika')
          status = await getPikaGenerationStatus({ apiKey }, generationId)
          break
        case 'kling':
          const { getKlingGenerationStatus } = await import('./video-generators/kling')
          status = await getKlingGenerationStatus({ apiKey }, generationId)
          break
        default:
          throw new Error(`Unsupported video model: ${model}`)
      }

      if (status.status === 'completed' || status.status === 'success') {
        return {
          id: status.id,
          videoUrl: status.videoUrl,
          thumbnailUrl: status.thumbnailUrl,
          status: 'success',
        }
      }

      if (status.status === 'failed' || status.status === 'error') {
        throw new Error(status.error || 'Video generation failed')
      }

      // 继续等待
      await new Promise(resolve => setTimeout(resolve, pollInterval))
    } catch (error: any) {
      // 如果是最终错误，抛出
      if (error.message.includes('failed') || error.message.includes('error')) {
        throw error
      }
      // 否则继续轮询
      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }
  }

  throw new Error('Video generation timeout')
}

async function processFileUpload(fileId: string): Promise<void> {
  // TODO: Implement file processing (metadata extraction, thumbnails, etc.)
  const file = await prisma.file.findUnique({
    where: { id: fileId },
    include: { metadata: true },
  })

  if (!file) {
    throw new Error(`File not found: ${fileId}`)
  }

  // Placeholder: File processing logic will be implemented in Part 7
  console.log(`Processing file: ${file.originalFilename}`)
}

// Worker event handlers
aiWorker.on('completed', (job) => {
  console.log(`[AI Worker] Job ${job.id} completed`)
})

aiWorker.on('failed', (job, err) => {
  console.error(`[AI Worker] Job ${job?.id} failed:`, err)
})

videoWorker.on('completed', (job) => {
  console.log(`[Video Worker] Job ${job.id} completed`)
})

videoWorker.on('failed', (job, err) => {
  console.error(`[Video Worker] Job ${job?.id} failed:`, err)
})

uploadWorker.on('completed', (job) => {
  console.log(`[Upload Worker] Job ${job.id} completed`)
})

uploadWorker.on('failed', (job, err) => {
  console.error(`[Upload Worker] Job ${job?.id} failed:`, err)
})

