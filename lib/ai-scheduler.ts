/**
 * AI 调度器 - 生产级调度系统
 * 
 * 功能：
 * 1. 智能模型推荐（基于任务类型、成本、性能）
 * 2. 模型失败自动降级（Fallback）
 * 3. API Key 池轮询（防封）
 * 4. 成本控制（自动选择便宜模型）
 * 5. 任务链执行（文本 → 图 → 视频等）
 */

import type { TaskType, ModelType, TaskPriority } from './ai-router'
import { prisma } from './prisma'

// 模型成本配置（每1000 tokens或每张图片）
export interface ModelCost {
  inputTokens: number  // 输入token成本（每1000 tokens）
  outputTokens: number // 输出token成本（每1000 tokens）
  image: number        // 图片生成成本（每张）
  video: number        // 视频生成成本（每秒）
}

// 模型性能配置
export interface ModelPerformance {
  speed: number        // 速度评分 1-10
  quality: number      // 质量评分 1-10
  reliability: number  // 可靠性评分 1-10
}

// 模型配置（扩展）
export interface EnhancedModelConfig {
  type: ModelType
  name: string
  supportedTasks: TaskType[]
  enabled: boolean
  apiKeys: string[]
  currentKeyIndex: number
  cost: ModelCost
  performance: ModelPerformance
  rateLimit?: {
    requestsPerMinute: number
    requestsPerDay: number
  }
  fallback?: ModelType[]
  // Key 使用统计
  keyStats: Map<string, {
    successCount: number
    failureCount: number
    lastUsed: Date
    isBlocked: boolean
  }>
}

// 任务链配置
export interface TaskChain {
  id: string
  steps: Array<{
    taskType: TaskType
    model?: ModelType
    input: any
    dependsOn?: number // 依赖的步骤索引
  }>
}

// 模型成本配置
const MODEL_COSTS: Record<ModelType, ModelCost> = {
  'gpt-4': {
    inputTokens: 0.03,
    outputTokens: 0.06,
    image: 0,
    video: 0,
  },
  'gpt-3.5': {
    inputTokens: 0.0015,
    outputTokens: 0.002,
    image: 0,
    video: 0,
  },
  'gemini-pro': {
    inputTokens: 0.0005,
    outputTokens: 0.0015,
    image: 0.02,
    video: 0,
  },
  'gemini-flash': {
    inputTokens: 0.0001,
    outputTokens: 0.0003,
    image: 0.01,
    video: 0,
  },
  'stable-diffusion': {
    inputTokens: 0,
    outputTokens: 0,
    image: 0.002,
    video: 0,
  },
  'flux': {
    inputTokens: 0,
    outputTokens: 0,
    image: 0.003,
    video: 0,
  },
  'runway': {
    inputTokens: 0,
    outputTokens: 0,
    image: 0,
    video: 0.05,
  },
  'pika': {
    inputTokens: 0,
    outputTokens: 0,
    image: 0,
    video: 0.04,
  },
  'kling': {
    inputTokens: 0,
    outputTokens: 0,
    image: 0,
    video: 0.03,
  },
  'whisper': {
    inputTokens: 0.006,
    outputTokens: 0,
    image: 0,
    video: 0,
  },
  'ocr': {
    inputTokens: 0,
    outputTokens: 0,
    image: 0.001,
    video: 0,
  },
}

// 模型性能配置
const MODEL_PERFORMANCE: Record<ModelType, ModelPerformance> = {
  'gpt-4': { speed: 6, quality: 10, reliability: 9 },
  'gpt-3.5': { speed: 8, quality: 7, reliability: 9 },
  'gemini-pro': { speed: 7, quality: 9, reliability: 8 },
  'gemini-flash': { speed: 9, quality: 8, reliability: 8 },
  'stable-diffusion': { speed: 5, quality: 7, reliability: 7 },
  'flux': { speed: 6, quality: 9, reliability: 7 },
  'runway': { speed: 4, quality: 9, reliability: 6 },
  'pika': { speed: 5, quality: 8, reliability: 6 },
  'kling': { speed: 5, quality: 8, reliability: 7 },
  'whisper': { speed: 8, quality: 9, reliability: 9 },
  'ocr': { speed: 7, quality: 7, reliability: 8 },
}

// 模型推荐规则
export class ModelRecommender {
  /**
   * 推荐最佳模型（基于任务类型、成本、性能）
   */
  static recommendModel(
    taskType: TaskType,
    priority: TaskPriority,
    budget?: 'low' | 'normal' | 'high',
    availableModels: EnhancedModelConfig[] = []
  ): EnhancedModelConfig | null {
    if (availableModels.length === 0) {
      return null
    }

    // 根据优先级和预算计算权重
    const costWeight = budget === 'low' ? 0.6 : budget === 'high' ? 0.2 : 0.4
    const qualityWeight = priority === 'urgent' ? 0.3 : priority === 'high' ? 0.5 : 0.4
    const speedWeight = priority === 'urgent' ? 0.5 : 0.2
    const reliabilityWeight = 0.3

    // 计算每个模型的综合得分
    const scores = availableModels.map(model => {
      const perf = MODEL_PERFORMANCE[model.type]
      const cost = MODEL_COSTS[model.type]

      // 成本得分（越低越好）
      let costScore = 1
      if (taskType === 'image') {
        costScore = 1 / (cost.image + 0.001) // 避免除零
      } else if (taskType === 'video') {
        costScore = 1 / (cost.video + 0.001)
      } else {
        costScore = 1 / (cost.inputTokens + cost.outputTokens + 0.001)
      }
      // 归一化到 0-10
      const maxCost = Math.max(...availableModels.map(m => {
        const c = MODEL_COSTS[m.type]
        return taskType === 'image' ? c.image : taskType === 'video' ? c.video : c.inputTokens + c.outputTokens
      }))
      costScore = (costScore / (1 / (maxCost + 0.001))) * 10

      // 综合得分
      const score =
        perf.quality * qualityWeight +
        perf.speed * speedWeight +
        perf.reliability * reliabilityWeight +
        costScore * costWeight

      return { model, score }
    })

    // 按得分排序，返回最高分
    scores.sort((a, b) => b.score - a.score)
    return scores[0]?.model || null
  }

  /**
   * 获取降级模型列表
   */
  static getFallbackModels(
    primaryModel: ModelType,
    taskType: TaskType,
    availableModels: EnhancedModelConfig[]
  ): ModelType[] {
    const fallbacks: ModelType[] = []

    // 获取主模型的降级配置
    const primaryConfig = availableModels.find(m => m.type === primaryModel)
    if (primaryConfig?.fallback) {
      fallbacks.push(...primaryConfig.fallback)
    }

    // 如果没有配置，根据任务类型自动选择降级模型
    if (fallbacks.length === 0) {
      const sameTaskModels = availableModels
        .filter(m => m.supportedTasks.includes(taskType) && m.type !== primaryModel)
        .sort((a, b) => {
          const perfA = MODEL_PERFORMANCE[a.type]
          const perfB = MODEL_PERFORMANCE[b.type]
          return (perfB.quality + perfB.reliability) - (perfA.quality + perfA.reliability)
        })
        .map(m => m.type)
        .slice(0, 3) // 最多3个降级模型

      fallbacks.push(...sameTaskModels)
    }

    return fallbacks
  }
}

// API Key 管理器（带轮询和统计）
export class APIKeyManager {
  private keyStats: Map<string, Map<string, {
    successCount: number
    failureCount: number
    lastUsed: Date
    isBlocked: boolean
    blockUntil?: Date
  }>> = new Map()

  /**
   * 获取下一个可用的 API Key（轮询 + 健康检查）
   */
  getNextKey(modelType: ModelType, apiKeys: string[]): string | null {
    if (apiKeys.length === 0) {
      return null
    }

    // 获取或初始化统计
    if (!this.keyStats.has(modelType)) {
      this.keyStats.set(modelType, new Map())
    }
    const stats = this.keyStats.get(modelType)!

    // 过滤掉被阻止的 Key
    const availableKeys = apiKeys.filter(key => {
      const keyStat = stats.get(key)
      if (!keyStat) return true
      
      // 检查是否被阻止
      if (keyStat.isBlocked) {
        if (keyStat.blockUntil && keyStat.blockUntil > new Date()) {
          return false // 仍在阻止期内
        }
        // 阻止期已过，解除阻止
        keyStat.isBlocked = false
        keyStat.blockUntil = undefined
        keyStat.failureCount = 0 // 重置失败计数
      }
      
      return true
    })

    if (availableKeys.length === 0) {
      return null
    }

    // 选择使用最少的 Key（轮询）
    const keyUsage = availableKeys.map(key => {
      const stat = stats.get(key) || {
        successCount: 0,
        failureCount: 0,
        lastUsed: new Date(0),
        isBlocked: false,
      }
      return { key, usage: stat.successCount + stat.failureCount, lastUsed: stat.lastUsed }
    })

    keyUsage.sort((a, b) => {
      if (a.usage !== b.usage) {
        return a.usage - b.usage // 使用少的优先
      }
      return a.lastUsed.getTime() - b.lastUsed.getTime() // 最后使用时间早的优先
    })

    const selectedKey = keyUsage[0].key

    // 更新统计
    const stat = stats.get(selectedKey) || {
      successCount: 0,
      failureCount: 0,
      lastUsed: new Date(0),
      isBlocked: false,
    }
    stat.lastUsed = new Date()
    stats.set(selectedKey, stat)

    return selectedKey
  }

  /**
   * 记录 Key 使用成功
   */
  recordSuccess(modelType: ModelType, apiKey: string): void {
    if (!this.keyStats.has(modelType)) {
      this.keyStats.set(modelType, new Map())
    }
    const stats = this.keyStats.get(modelType)!
    const stat = stats.get(apiKey) || {
      successCount: 0,
      failureCount: 0,
      lastUsed: new Date(),
      isBlocked: false,
    }
    stat.successCount++
    stats.set(apiKey, stat)
  }

  /**
   * 记录 Key 使用失败
   */
  recordFailure(modelType: ModelType, apiKey: string, error?: string): void {
    if (!this.keyStats.has(modelType)) {
      this.keyStats.set(modelType, new Map())
    }
    const stats = this.keyStats.get(modelType)!
    const stat = stats.get(apiKey) || {
      successCount: 0,
      failureCount: 0,
      lastUsed: new Date(),
      isBlocked: false,
    }
    stat.failureCount++

    // 如果连续失败超过3次，暂时阻止该 Key
    if (stat.failureCount >= 3) {
      stat.isBlocked = true
      stat.blockUntil = new Date(Date.now() + 60 * 60 * 1000) // 阻止1小时
      console.warn(`[API Key Manager] Key blocked for model ${modelType} due to repeated failures`)
    }

    stats.set(apiKey, stat)
  }

  /**
   * 获取 Key 统计信息
   */
  getKeyStats(modelType: ModelType): Map<string, any> {
    return this.keyStats.get(modelType) || new Map()
  }
}

// 任务链执行器
export class TaskChainExecutor {
  /**
   * 执行任务链
   */
  static async executeChain(
    chain: TaskChain,
    userId: string,
    router: any // AIRouter instance
  ): Promise<any[]> {
    const results: any[] = []
    const stepResults: Map<number, any> = new Map()

    for (let i = 0; i < chain.steps.length; i++) {
      const step = chain.steps[i]

      // 检查依赖
      if (step.dependsOn !== undefined) {
        const dependencyResult = stepResults.get(step.dependsOn)
        if (!dependencyResult) {
          throw new Error(`Step ${i} depends on step ${step.dependsOn} which failed`)
        }
        // 将依赖结果合并到输入
        step.input = {
          ...step.input,
          ...dependencyResult,
        }
      }

      // 执行步骤
      try {
        const task = await router.routeTask(
          userId,
          {
            ...step.input,
            type: step.taskType,
            model: step.model,
          },
          'normal'
        )

        // 等待任务完成（简化版，实际应该轮询）
        const result = await this.waitForTaskCompletion(task.id)
        results.push(result)
        stepResults.set(i, result)
      } catch (error: any) {
        console.error(`[Task Chain] Step ${i} failed:`, error)
        throw new Error(`Task chain failed at step ${i}: ${error.message}`)
      }
    }

    return results
  }

  /**
   * 等待任务完成（简化版）
   */
  private static async waitForTaskCompletion(taskId: string, maxWait: number = 300000): Promise<any> {
    const startTime = Date.now()

    while (Date.now() - startTime < maxWait) {
      const task = await prisma.aiTask.findUnique({
        where: { id: taskId },
      })

      if (!task) {
        throw new Error(`Task ${taskId} not found`)
      }

      if (task.status === 'success') {
        return task.resultData ? JSON.parse(task.resultData) : null
      }

      if (task.status === 'failed') {
        throw new Error(task.error || 'Task failed')
      }

      // 等待1秒后重试
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    throw new Error(`Task ${taskId} timeout`)
  }
}

// 单例 API Key Manager
let apiKeyManagerInstance: APIKeyManager | null = null

export function getAPIKeyManager(): APIKeyManager {
  if (!apiKeyManagerInstance) {
    apiKeyManagerInstance = new APIKeyManager()
  }
  return apiKeyManagerInstance
}

