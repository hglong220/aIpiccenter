/**
 * AI Router - 统一的AI调度系统
 * 
 * 功能：
 * 1. 自动识别任务类型（文本、图像、视频、音频、文档、代码、复合任务）
 * 2. 自动匹配最佳模型
 * 3. 自动降级/切换模型（失败时）
 * 4. 任务队列管理
 * 5. 模型密钥管理
 */

import type { ImageGenerationRequest, VideoGenerationRequest } from '@/types'
import { aiQueue, videoQueue } from './queues'
import { prisma } from './prisma'
import { ModelRecommender, getAPIKeyManager, TaskChainExecutor } from './ai-scheduler'

// 任务类型
export type TaskType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'code' | 'composite'

// 模型类型
export type ModelType = 
  | 'gpt-4' 
  | 'gpt-3.5' 
  | 'gemini-pro' 
  | 'gemini-flash'
  | 'stable-diffusion'
  | 'flux'
  | 'runway'
  | 'pika'
  | 'kling'
  | 'whisper'
  | 'ocr'

// 任务状态
export type TaskStatus = 'pending' | 'running' | 'success' | 'failed' | 'retry'

// 任务优先级
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent'

// AI任务接口
export interface AITask {
  id: string
  userId: string
  type: TaskType
  priority: TaskPriority
  status: TaskStatus
  model?: ModelType
  fallbackModels?: ModelType[]
  request: any // 原始请求数据
  result?: any
  error?: string
  retryCount: number
  maxRetries: number
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
}

// 模型配置
export interface ModelConfig {
  type: ModelType
  name: string
  supportedTasks: TaskType[]
  enabled: boolean
  apiKeys: string[] // 密钥池
  currentKeyIndex: number
  rateLimit?: {
    requestsPerMinute: number
    requestsPerDay: number
  }
  fallback?: ModelType[] // 降级模型列表
}

// 任务队列已迁移到 BullMQ (lib/queues.ts)
// 保留此接口以保持向后兼容

// 模型配置管理
class ModelManager {
  private models: Map<ModelType, ModelConfig> = new Map()

  constructor() {
    this.initializeModels()
  }

  private initializeModels(): void {
    // GPT模型
    this.models.set('gpt-4', {
      type: 'gpt-4',
      name: 'GPT-4',
      supportedTasks: ['text', 'document', 'code'],
      enabled: !!process.env.OPENAI_API_KEY,
      apiKeys: this.getApiKeys('OPENAI_API_KEY'),
      currentKeyIndex: 0,
      fallback: ['gpt-3.5', 'gemini-pro'],
    })

    this.models.set('gpt-3.5', {
      type: 'gpt-3.5',
      name: 'GPT-3.5',
      supportedTasks: ['text', 'document'],
      enabled: !!process.env.OPENAI_API_KEY,
      apiKeys: this.getApiKeys('OPENAI_API_KEY'),
      currentKeyIndex: 0,
      fallback: ['gemini-flash'],
    })

    // Gemini模型
    this.models.set('gemini-pro', {
      type: 'gemini-pro',
      name: 'Gemini Pro',
      supportedTasks: ['text', 'image', 'document', 'code'],
      enabled: !!process.env.GOOGLE_GEMINI_API_KEY,
      apiKeys: this.getApiKeys('GOOGLE_GEMINI_API_KEY'),
      currentKeyIndex: 0,
      fallback: ['gemini-flash'],
    })

    this.models.set('gemini-flash', {
      type: 'gemini-flash',
      name: 'Gemini Flash',
      supportedTasks: ['text', 'image', 'document'],
      enabled: !!process.env.GOOGLE_GEMINI_API_KEY,
      apiKeys: this.getApiKeys('GOOGLE_GEMINI_API_KEY'),
      currentKeyIndex: 0,
    })

    // 图像生成模型
    this.models.set('stable-diffusion', {
      type: 'stable-diffusion',
      name: 'Stable Diffusion',
      supportedTasks: ['image'],
      enabled: !!process.env.STABLE_DIFFUSION_API_KEY,
      apiKeys: this.getApiKeys('STABLE_DIFFUSION_API_KEY'),
      currentKeyIndex: 0,
      fallback: ['flux'],
    })

    this.models.set('flux', {
      type: 'flux',
      name: 'Flux',
      supportedTasks: ['image'],
      enabled: !!process.env.FLUX_API_KEY,
      apiKeys: this.getApiKeys('FLUX_API_KEY'),
      currentKeyIndex: 0,
    })

    // 视频生成模型
    this.models.set('runway', {
      type: 'runway',
      name: 'Runway',
      supportedTasks: ['video'],
      enabled: !!process.env.RUNWAY_API_KEY,
      apiKeys: this.getApiKeys('RUNWAY_API_KEY'),
      currentKeyIndex: 0,
      fallback: ['pika', 'kling'],
    })

    this.models.set('pika', {
      type: 'pika',
      name: 'Pika',
      supportedTasks: ['video'],
      enabled: !!process.env.PIKA_API_KEY,
      apiKeys: this.getApiKeys('PIKA_API_KEY'),
      currentKeyIndex: 0,
      fallback: ['kling'],
    })

    this.models.set('kling', {
      type: 'kling',
      name: 'Kling',
      supportedTasks: ['video'],
      enabled: !!process.env.KLING_API_KEY,
      apiKeys: this.getApiKeys('KLING_API_KEY'),
      currentKeyIndex: 0,
    })

    // 音频模型
    this.models.set('whisper', {
      type: 'whisper',
      name: 'Whisper',
      supportedTasks: ['audio'],
      enabled: !!process.env.OPENAI_API_KEY, // Whisper使用OpenAI API
      apiKeys: this.getApiKeys('OPENAI_API_KEY'),
      currentKeyIndex: 0,
    })

    // OCR模型
    this.models.set('ocr', {
      type: 'ocr',
      name: 'OCR',
      supportedTasks: ['document'],
      enabled: true, // 可以使用Tesseract等开源方案
      apiKeys: [],
      currentKeyIndex: 0,
    })
  }

  private getApiKeys(envKey: string): string[] {
    const keys = process.env[envKey]
    if (!keys) return []
    
    // 支持多个密钥，用逗号分隔
    return keys.split(',').map(k => k.trim()).filter(k => k.length > 0)
  }

  getModel(type: ModelType): ModelConfig | undefined {
    return this.models.get(type)
  }

  getAvailableModels(taskType: TaskType): ModelConfig[] {
    return Array.from(this.models.values())
      .filter(model => model.enabled && model.supportedTasks.includes(taskType))
  }

  getNextApiKey(modelType: ModelType): string | null {
    const model = this.models.get(modelType)
    if (!model || model.apiKeys.length === 0) {
      return null
    }

    // 轮询使用密钥
    const key = model.apiKeys[model.currentKeyIndex]
    model.currentKeyIndex = (model.currentKeyIndex + 1) % model.apiKeys.length
    return key
  }

  rotateApiKey(modelType: ModelType): void {
    const model = this.models.get(modelType)
    if (model && model.apiKeys.length > 0) {
      model.currentKeyIndex = (model.currentKeyIndex + 1) % model.apiKeys.length
    }
  }
}

// 任务类型识别器
class TaskTypeDetector {
  detectTaskType(request: any): TaskType {
    // 检查是否有图像生成请求
    if (this.isImageGenerationRequest(request)) {
      return 'image'
    }

    // 检查是否有视频生成请求
    if (this.isVideoGenerationRequest(request)) {
      return 'video'
    }

    // 检查是否有音频请求
    if (this.isAudioRequest(request)) {
      return 'audio'
    }

    // 检查是否有文档请求
    if (this.isDocumentRequest(request)) {
      return 'document'
    }

    // 检查是否有代码请求
    if (this.isCodeRequest(request)) {
      return 'code'
    }

    // 检查是否有多个文件（复合任务）
    if (this.isCompositeRequest(request)) {
      return 'composite'
    }

    // 默认为文本任务
    return 'text'
  }

  private isImageGenerationRequest(request: any): boolean {
    return (
      request.prompt !== undefined &&
      (request.width !== undefined || request.height !== undefined) ||
      request.type === 'image' ||
      request.taskType === 'image'
    )
  }

  private isVideoGenerationRequest(request: any): boolean {
    return (
      request.type === 'video' ||
      request.taskType === 'video' ||
      request.duration !== undefined ||
      request.resolution !== undefined
    )
  }

  private isAudioRequest(request: any): boolean {
    return (
      request.type === 'audio' ||
      request.taskType === 'audio' ||
      request.audioFile !== undefined ||
      request.transcribe !== undefined
    )
  }

  private isDocumentRequest(request: any): boolean {
    return (
      request.type === 'document' ||
      request.taskType === 'document' ||
      request.documentFile !== undefined ||
      request.fileType === 'pdf' ||
      request.fileType === 'doc' ||
      request.fileType === 'docx' ||
      request.fileType === 'ppt' ||
      request.fileType === 'pptx' ||
      request.fileType === 'xls' ||
      request.fileType === 'xlsx'
    )
  }

  private isCodeRequest(request: any): boolean {
    return (
      request.type === 'code' ||
      request.taskType === 'code' ||
      request.codeFile !== undefined ||
      request.programmingLanguage !== undefined
    )
  }

  private isCompositeRequest(request: any): boolean {
    return (
      Array.isArray(request.files) && request.files.length > 1 ||
      (request.files && Object.keys(request.files).length > 1)
    )
  }
}

// AI路由器主类
export class AIRouter {
  private modelManager: ModelManager
  private taskDetector: TaskTypeDetector

  constructor() {
    this.modelManager = new ModelManager()
    this.taskDetector = new TaskTypeDetector()
  }

  /**
   * 路由AI任务（使用 BullMQ + 智能调度）
   */
  async routeTask(
    userId: string,
    request: any,
    priority: TaskPriority = 'normal'
  ): Promise<AITask> {
    // 1. 识别任务类型
    const taskType = this.taskDetector.detectTaskType(request)

    // 2. 选择最佳模型（使用智能推荐）
    const model = this.selectBestModel(taskType, request, priority)

    if (!model) {
      throw new Error(`No available model for task type: ${taskType}`)
    }

    // 3. 获取降级模型列表
    const availableModels = this.modelManager.getAvailableModels(taskType)
    const fallbackModels = ModelRecommender.getFallbackModels(
      model.type,
      taskType,
      availableModels.map(m => ({ ...m, cost: this.getModelCost(m.type), performance: this.getModelPerformance(m.type) })) as any
    )

    // 4. 创建数据库记录
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const dbTask = await prisma.aiTask.create({
      data: {
        id: taskId,
        userId,
        taskType,
        priority,
        status: 'pending',
        model: model.type,
        fallbackModels: fallbackModels.length > 0 ? JSON.stringify(fallbackModels) : null,
        requestData: JSON.stringify(request),
        maxRetries: 3,
      },
    })

    // 5. 选择队列（根据任务类型）
    const queue = taskType === 'video' ? videoQueue : aiQueue

    // 6. 计算优先级（BullMQ 使用数字，越大优先级越高）
    const priorityValue = {
      urgent: 10,
      high: 7,
      normal: 5,
      low: 1,
    }[priority] || 5

    // 7. 添加到队列
    await queue.add(
      taskId,
      {
        taskId,
        userId,
        taskType,
        request,
        model: model.type,
        fallbackModels,
      },
      {
        priority: priorityValue,
        jobId: taskId, // 使用 taskId 作为 jobId
      }
    )

    // 8. 返回任务对象
    return {
      id: dbTask.id,
      userId: dbTask.userId,
      type: dbTask.taskType as TaskType,
      priority: dbTask.priority as TaskPriority,
      status: dbTask.status as TaskStatus,
      model: dbTask.model as ModelType | undefined,
      fallbackModels: dbTask.fallbackModels
        ? (JSON.parse(dbTask.fallbackModels) as ModelType[])
        : undefined,
      request,
      retryCount: dbTask.retryCount,
      maxRetries: dbTask.maxRetries,
      createdAt: dbTask.createdAt,
    }
  }

  /**
   * 执行任务链（文本 → 图 → 视频等）
   */
  async executeTaskChain(
    userId: string,
    chain: {
      steps: Array<{
        taskType: TaskType
        model?: ModelType
        input: any
        dependsOn?: number
      }>
    }
  ): Promise<any[]> {
    const taskChain = {
      id: `chain_${Date.now()}`,
      steps: chain.steps,
    }
    return TaskChainExecutor.executeChain(taskChain, userId, this)
  }

  /**
   * 选择最佳模型（使用智能推荐）
   */
  private selectBestModel(taskType: TaskType, request: any, priority: TaskPriority = 'normal'): ModelConfig | null {
    const availableModels = this.modelManager.getAvailableModels(taskType)
    
    if (availableModels.length === 0) {
      return null
    }

    // 如果请求中指定了模型，优先使用
    if (request.model) {
      const specifiedModel = availableModels.find(m => m.type === request.model)
      if (specifiedModel) {
        return specifiedModel
      }
    }

    // 使用智能推荐（考虑成本、性能、优先级）
    const budget = request.budget || 'normal' // low, normal, high
    const enhancedModels = availableModels.map(m => ({
      ...m,
      cost: this.getModelCost(m.type),
      performance: this.getModelPerformance(m.type),
    }))

    const recommended = ModelRecommender.recommendModel(
      taskType,
      priority,
      budget,
      enhancedModels as any
    )

    return recommended || availableModels[0]
  }

  /**
   * 获取模型成本（使用 ai-scheduler.ts 中的配置）
   */
  private getModelCost(modelType: ModelType): any {
    const { MODEL_COSTS } = require('./ai-scheduler')
    return MODEL_COSTS[modelType] || {
      inputTokens: 0.001,
      outputTokens: 0.002,
      image: 0.01,
      video: 0.05,
    }
  }

  /**
   * 获取模型性能（使用 ai-scheduler.ts 中的配置）
   */
  private getModelPerformance(modelType: ModelType): any {
    const { MODEL_PERFORMANCE } = require('./ai-scheduler')
    return MODEL_PERFORMANCE[modelType] || {
      speed: 7,
      quality: 8,
      reliability: 8,
    }
  }

  // 任务处理已迁移到 queue-workers.ts
  // 此方法保留用于直接调用（不通过队列）

  /**
   * 执行任务（调用实际的AI服务）
   */
  private async executeTask(task: AITask, apiKey: string): Promise<any> {
    // 这里会根据不同的模型类型调用不同的服务
    // 实际实现会在各个模型适配器中
    switch (task.model) {
      case 'gemini-pro':
      case 'gemini-flash':
        return await this.executeGeminiTask(task, apiKey)
      case 'gpt-4':
      case 'gpt-3.5':
        return await this.executeGPTTask(task, apiKey)
      case 'stable-diffusion':
      case 'flux':
        return await this.executeImageGenerationTask(task, apiKey)
      case 'runway':
      case 'pika':
      case 'kling':
        return await this.executeVideoGenerationTask(task, apiKey)
      case 'whisper':
        return await this.executeWhisperTask(task, apiKey)
      default:
        throw new Error(`Unsupported model: ${task.model}`)
    }
  }

  /**
   * 执行Gemini任务
   */
  private async executeGeminiTask(task: AITask, apiKey: string): Promise<any> {
    // 导入gemini库
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(apiKey)
    
    if (task.type === 'image') {
      // 图像生成 - 使用lib/gemini.ts中的generateImage函数
      const { generateImage } = await import('./gemini')
      const result = await generateImage({
        prompt: task.request.prompt || '',
        negativePrompt: task.request.negativePrompt,
        width: task.request.width || 1024,
        height: task.request.height || 1024,
      })
      return {
        imageUrl: result.imageUrl,
        prompt: result.prompt,
      }
    } else {
      // 文本生成
      const model = genAI.getGenerativeModel({ model: task.model === 'gemini-flash' ? 'gemini-1.5-flash' : 'gemini-1.5-pro' })
      const result = await model.generateContent(task.request.prompt || task.request.text)
      return result.response.text()
    }
  }

  /**
   * 执行GPT任务
   */
  private async executeGPTTask(task: AITask, apiKey: string): Promise<any> {
    try {
      // 动态导入OpenAI SDK
      const { OpenAI } = await import('openai').catch(() => {
        throw new Error('openai package not installed. Run: npm install openai')
      })

      const openai = new OpenAI({ apiKey })
      const model = task.model === 'gpt-4' ? 'gpt-4' : 'gpt-3.5-turbo'

      // 构建消息
      const messages: any[] = []
      if (task.request.systemPrompt) {
        messages.push({ role: 'system', content: task.request.systemPrompt })
      }
      messages.push({ role: 'user', content: task.request.prompt || task.request.text || '' })

      // 调用OpenAI API
      const completion = await openai.chat.completions.create({
        model,
        messages,
        temperature: task.request.temperature || 0.7,
        max_tokens: task.request.maxTokens || 2000,
      })

      return completion.choices[0]?.message?.content || ''
    } catch (error: any) {
      console.error('[GPT Task] Error:', error)
      throw new Error(`GPT任务执行失败: ${error.message}`)
    }
  }

  /**
   * 执行图像生成任务
   */
  private async executeImageGenerationTask(task: AITask, apiKey: string): Promise<any> {
    try {
      const { prompt, negativePrompt, width, height, model: imageModel } = task.request

      // 使用Gemini图像生成
      if (imageModel === 'gemini' || !imageModel) {
        const { generateImage } = await import('./gemini')
        const result = await generateImage({
          prompt,
          negativePrompt,
          width: width || 1024,
          height: height || 1024,
        })
        return {
          imageUrl: result.imageUrl,
          prompt: result.prompt,
        }
      }

      // 使用Stable Diffusion或Flux (需要配置相应的API)
      if (imageModel === 'stable-diffusion' || imageModel === 'flux') {
        // 这里可以集成Stability AI或其他图像生成API
        const apiUrl = imageModel === 'flux' 
          ? process.env.FLUX_API_URL || 'https://api.flux.ai/v1/generate'
          : process.env.STABLE_DIFFUSION_API_URL || 'https://api.stability.ai/v1/generation'

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            negative_prompt: negativePrompt,
            width: width || 1024,
            height: height || 1024,
          }),
        })

        if (!response.ok) {
          throw new Error(`图像生成API失败: ${response.status}`)
        }

        const data = await response.json()
        return {
          imageUrl: data.imageUrl || data.images?.[0]?.url,
          prompt,
        }
      }

      throw new Error(`不支持的图像生成模型: ${imageModel}`)
    } catch (error: any) {
      console.error('[Image Generation Task] Error:', error)
      throw new Error(`图像生成任务执行失败: ${error.message}`)
    }
  }

  /**
   * 执行视频生成任务
   */
  private async executeVideoGenerationTask(task: AITask, apiKey: string): Promise<any> {
    const { prompt, imageUrl, duration, aspectRatio, model } = task.request

    switch (model) {
      case 'runway':
        return await this.executeRunwayTask(apiKey, {
          prompt,
          imageUrl,
          duration,
          aspectRatio,
        })
      case 'pika':
        return await this.executePikaTask(apiKey, {
          prompt,
          imageUrl,
          duration,
          aspectRatio,
        })
      case 'kling':
        return await this.executeKlingTask(apiKey, {
          prompt,
          imageUrl,
          duration,
          aspectRatio,
        })
      default:
        throw new Error(`Unsupported video model: ${model}`)
    }
  }

  /**
   * 执行 Runway 任务
   */
  private async executeRunwayTask(apiKey: string, request: any): Promise<any> {
    const { createRunwayGeneration } = await import('./video-generators/runway')
    const result = await createRunwayGeneration(
      { apiKey },
      {
        prompt: request.prompt,
        imageUrl: request.imageUrl,
        duration: request.duration || 5,
        aspectRatio: request.aspectRatio || '16:9',
      }
    )
    return result
  }

  /**
   * 执行 Pika 任务
   */
  private async executePikaTask(apiKey: string, request: any): Promise<any> {
    const { createPikaGeneration } = await import('./video-generators/pika')
    const result = await createPikaGeneration(
      { apiKey },
      {
        prompt: request.prompt,
        imageUrl: request.imageUrl,
        duration: request.duration || 4,
        aspectRatio: request.aspectRatio || '16:9',
      }
    )
    return result
  }

  /**
   * 执行 Kling 任务
   */
  private async executeKlingTask(apiKey: string, request: any): Promise<any> {
    const { createKlingGeneration } = await import('./video-generators/kling')
    const result = await createKlingGeneration(
      { apiKey },
      {
        prompt: request.prompt,
        imageUrl: request.imageUrl,
        duration: request.duration || 5,
        aspectRatio: request.aspectRatio || '16:9',
      }
    )
    return result
  }

  /**
   * 执行Whisper任务
   */
  private async executeWhisperTask(task: AITask, apiKey: string): Promise<any> {
    try {
      const { audioUrl, audioPath, language } = task.request

      // 动态导入OpenAI SDK
      const { OpenAI } = await import('openai').catch(() => {
        throw new Error('openai package not installed. Run: npm install openai')
      })

      const openai = new OpenAI({ apiKey })

      // 读取音频文件
      let audioBuffer: Buffer
      if (audioPath) {
        const fs = await import('fs/promises')
        audioBuffer = await fs.readFile(audioPath)
      } else if (audioUrl) {
        const response = await fetch(audioUrl)
        audioBuffer = Buffer.from(await response.arrayBuffer())
      } else {
        throw new Error('缺少音频文件路径或URL')
      }

      // 创建File对象
      const audioFile = new File([audioBuffer], 'audio.mp3', { type: 'audio/mpeg' })

      // 调用Whisper API
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile as any,
        model: 'whisper-1',
        language: language || undefined,
        response_format: 'verbose_json',
      })

      return {
        text: transcription.text,
        language: transcription.language,
        segments: (transcription as any).segments || [],
      }
    } catch (error: any) {
      console.error('[Whisper Task] Error:', error)
      throw new Error(`Whisper任务执行失败: ${error.message}`)
    }
  }

  /**
   * 获取任务状态
   */
  getTask(taskId: string): AITask | undefined {
    return this.tasks.get(taskId)
  }

  /**
   * 获取队列状态（从 BullMQ）
   */
  async getQueueStatus(): Promise<{ queueLength: number; runningCount: number }> {
    const [aiWaiting, aiActive] = await Promise.all([
      aiQueue.getWaitingCount(),
      aiQueue.getActiveCount(),
    ])

    const [videoWaiting, videoActive] = await Promise.all([
      videoQueue.getWaitingCount(),
      videoQueue.getActiveCount(),
    ])

    return {
      queueLength: aiWaiting + videoWaiting,
      runningCount: aiActive + videoActive,
    }
  }
}

// 单例实例
let routerInstance: AIRouter | null = null

export function getAIRouter(): AIRouter {
  if (!routerInstance) {
    routerInstance = new AIRouter()
  }
  return routerInstance
}

