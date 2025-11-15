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

// 任务队列（内存实现，生产环境建议使用Redis/BullMQ）
class TaskQueue {
  private queue: AITask[] = []
  private running: Set<string> = new Set()
  private maxConcurrent: number = 5

  async enqueue(task: AITask): Promise<void> {
    this.queue.push(task)
    this.processQueue()
  }

  async dequeue(): Promise<AITask | null> {
    if (this.running.size >= this.maxConcurrent) {
      return null
    }

    // 按优先级排序
    this.queue.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })

    const task = this.queue.shift()
    if (task) {
      this.running.add(task.id)
    }
    return task || null
  }

  async complete(taskId: string): Promise<void> {
    this.running.delete(taskId)
    this.processQueue()
  }

  private async processQueue(): Promise<void> {
    while (this.running.size < this.maxConcurrent) {
      const task = await this.dequeue()
      if (!task) break
      // 任务处理在外部进行
    }
  }

  getQueueLength(): number {
    return this.queue.length
  }

  getRunningCount(): number {
    return this.running.size
  }
}

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
  private taskQueue: TaskQueue
  private modelManager: ModelManager
  private taskDetector: TaskTypeDetector
  private tasks: Map<string, AITask> = new Map()

  constructor() {
    this.taskQueue = new TaskQueue()
    this.modelManager = new ModelManager()
    this.taskDetector = new TaskTypeDetector()
  }

  /**
   * 路由AI任务
   */
  async routeTask(
    userId: string,
    request: any,
    priority: TaskPriority = 'normal'
  ): Promise<AITask> {
    // 1. 识别任务类型
    const taskType = this.taskDetector.detectTaskType(request)

    // 2. 选择最佳模型
    const model = this.selectBestModel(taskType, request)

    if (!model) {
      throw new Error(`No available model for task type: ${taskType}`)
    }

    // 3. 创建任务
    const task: AITask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: taskType,
      priority,
      status: 'pending',
      model: model.type,
      fallbackModels: model.fallback,
      request,
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date(),
    }

    // 4. 加入队列
    this.tasks.set(task.id, task)
    await this.taskQueue.enqueue(task)

    // 5. 异步处理任务
    this.processTask(task).catch(error => {
      console.error(`[AI Router] Task ${task.id} failed:`, error)
      task.status = 'failed'
      task.error = error.message
      task.completedAt = new Date()
    })

    return task
  }

  /**
   * 选择最佳模型
   */
  private selectBestModel(taskType: TaskType, request: any): ModelConfig | null {
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

    // 根据任务类型选择默认模型
    switch (taskType) {
      case 'text':
        return availableModels.find(m => m.type === 'gemini-pro') || 
               availableModels.find(m => m.type === 'gpt-4') ||
               availableModels[0]
      case 'image':
        return availableModels.find(m => m.type === 'gemini-pro') ||
               availableModels.find(m => m.type === 'stable-diffusion') ||
               availableModels[0]
      case 'video':
        return availableModels.find(m => m.type === 'runway') ||
               availableModels.find(m => m.type === 'pika') ||
               availableModels[0]
      case 'audio':
        return availableModels.find(m => m.type === 'whisper') || availableModels[0]
      case 'document':
        return availableModels.find(m => m.type === 'gemini-pro') ||
               availableModels.find(m => m.type === 'ocr') ||
               availableModels[0]
      case 'code':
        return availableModels.find(m => m.type === 'gpt-4') ||
               availableModels.find(m => m.type === 'gemini-pro') ||
               availableModels[0]
      default:
        return availableModels[0]
    }
  }

  /**
   * 处理任务
   */
  private async processTask(task: AITask): Promise<void> {
    task.status = 'running'
    task.startedAt = new Date()

    try {
      // 获取API密钥
      const apiKey = this.modelManager.getNextApiKey(task.model!)
      if (!apiKey) {
        throw new Error(`No API key available for model: ${task.model}`)
      }

      // 执行任务
      const result = await this.executeTask(task, apiKey)
      
      task.status = 'success'
      task.result = result
      task.completedAt = new Date()
    } catch (error: any) {
      // 尝试降级
      if (task.retryCount < task.maxRetries && task.fallbackModels && task.fallbackModels.length > 0) {
        task.retryCount++
        const fallbackModel = task.fallbackModels[0]
        task.model = fallbackModel
        task.fallbackModels = task.fallbackModels.slice(1)
        task.status = 'retry'
        
        console.log(`[AI Router] Task ${task.id} failed, retrying with ${fallbackModel}`)
        await this.processTask(task)
      } else {
        task.status = 'failed'
        task.error = error.message
        task.completedAt = new Date()
      }
    } finally {
      await this.taskQueue.complete(task.id)
    }
  }

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
      // 图像生成
      const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' })
      // 实现图像生成逻辑
      throw new Error('Gemini image generation not yet implemented')
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
    // TODO: 实现GPT调用
    throw new Error('GPT task execution not yet implemented')
  }

  /**
   * 执行图像生成任务
   */
  private async executeImageGenerationTask(task: AITask, apiKey: string): Promise<any> {
    // TODO: 实现图像生成
    throw new Error('Image generation task execution not yet implemented')
  }

  /**
   * 执行视频生成任务
   */
  private async executeVideoGenerationTask(task: AITask, apiKey: string): Promise<any> {
    // TODO: 实现视频生成
    throw new Error('Video generation task execution not yet implemented')
  }

  /**
   * 执行Whisper任务
   */
  private async executeWhisperTask(task: AITask, apiKey: string): Promise<any> {
    // TODO: 实现Whisper音频转文本
    throw new Error('Whisper task execution not yet implemented')
  }

  /**
   * 获取任务状态
   */
  getTask(taskId: string): AITask | undefined {
    return this.tasks.get(taskId)
  }

  /**
   * 获取队列状态
   */
  getQueueStatus(): { queueLength: number; runningCount: number } {
    return {
      queueLength: this.taskQueue.getQueueLength(),
      runningCount: this.taskQueue.getRunningCount(),
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

