/**
 * AI Commander - 高层任务指挥官 / 编排器
 *
 * 职责：
 * - 读取用户的高层目标（goal）、偏好（成本/质量/速度）、上下文
 * - 设计「任务链」（TaskChain）：如 文本 → 图片 → 视频 → 审核
 * - 为每一步标注 taskType / 建议模型 / 输入字段
 *
 * 说明：
 * - 这里只做「规划」，真正的执行仍交给 AI Router + 队列 + 各模型适配器
 * - 默认使用 GPT-4 或 Gemini Pro 作为 Planner，可通过环境变量配置
 */

import type { TaskType, ModelType, TaskPriority } from './ai-router'
import type { TaskChain } from './ai-scheduler'

export type CommanderBudget = 'low' | 'normal' | 'high'
export type CommanderQuality = 'standard' | 'high' | 'max'
export type CommanderSpeed = 'standard' | 'fast'

export interface CommanderPreferences {
  /** 成本优先级：越低越省钱 */
  budget?: CommanderBudget
  /** 质量档位 */
  quality?: CommanderQuality
  /** 速度要求 */
  speed?: CommanderSpeed
  /** 任务整体优先级（映射到队列） */
  priority?: TaskPriority
}

export interface CommanderUserProfile {
  id?: string
  level?: 'free' | 'pro' | 'enterprise'
  industry?: string
  language?: string
}

export interface CommanderRequest {
  /** 用户自然语言目标，例如：帮我做一条30秒的产品宣传视频，适合抖音 */
  goal: string
  /** 可选：已有的结构化输入（例如 prompt、参考图片等） */
  input?: any
  /** 上传文件/素材信息（可选，未来可扩展为详细的 FileInfo 数组） */
  files?: any[]
  /** 用户画像（用于选择策略/模型） */
  userProfile?: CommanderUserProfile
  /** 成本/质量/速度偏好 */
  preferences?: CommanderPreferences
  /** 明确指定希望的主任务类型（否则由 Commander 自行判断） */
  preferredTaskType?: TaskType
}

export interface CommanderStep {
  taskType: TaskType
  /** 建议模型（可以是 ModelType 或高层别名，由调度层做最终决定） */
  model?: ModelType | string
  /** 传给具体任务的 request 数据结构 */
  input: any
  /** 依赖哪一步骤的结果（索引），用于形成链式任务 */
  dependsOn?: number
}

export interface CommanderPlan extends TaskChain {}

/**
 * AI Commander 主类
 */
export class AICommander {
  /**
   * 规划任务链（优先使用大模型规划，缺少 API Key 时退回到规则引擎）
   */
  static async planTaskChain(request: CommanderRequest): Promise<CommanderPlan> {
    // 如果没有任何大模型可用，则使用简单规则快速兜底
    const hasOpenAI = !!process.env.OPENAI_API_KEY
    const hasGemini =
      !!process.env.GOOGLE_GEMINI_API_KEY ||
      !!process.env.NEXT_PUBLIC_GEMINI_API_KEY

    if (!hasOpenAI && !hasGemini) {
      return this.planWithHeuristics(request)
    }

    try {
      const plannerModel = process.env.AI_COMMANDER_MODEL || 'gpt-4'
      if (plannerModel.startsWith('gpt')) {
        return await this.planWithGPT(request, plannerModel)
      }

      if (plannerModel.startsWith('gemini')) {
        return await this.planWithGemini(request, plannerModel)
      }

      // 未知配置时，优先使用 GPT
      if (hasOpenAI) {
        return await this.planWithGPT(request, 'gpt-4')
      }
      if (hasGemini) {
        return await this.planWithGemini(request, 'gemini-1.5-pro')
      }

      return this.planWithHeuristics(request)
    } catch (error) {
      console.error('[AI Commander] Planner failed, fallback to heuristics:', error)
      return this.planWithHeuristics(request)
    }
  }

  /**
   * 根据订阅计划映射默认调度偏好（入门 / 基础 / 专业 / 旗舰）
   *
   * plan 约定（User.plan / Order.planId）：
   * - free / starter: 入门版
   * - basic: 基础版
   * - professional: 专业版
   * - enterprise: 旗舰版 / 企业版
   */
  static getPreferencesForPlan(plan: string | null | undefined): CommanderPreferences {
    const key = (plan || 'free').toLowerCase()

    // 入门版：极致省钱
    if (key === 'free' || key === 'starter' || key === 'entry' || key === 'entry-level') {
      return {
        budget: 'low',
        quality: 'standard',
        speed: 'standard',
        priority: 'low',
      }
    }

    // 基础版：推荐给大多数普通用户，兼顾性价比
    if (key === 'basic') {
      return {
        budget: 'normal',
        quality: 'standard',
        speed: 'standard',
        priority: 'normal',
      }
    }

    // 专业版：面向创作者/团队，质量与速度更优先
    if (key === 'professional' || key === 'pro') {
      return {
        budget: 'high',
        quality: 'high',
        speed: 'fast',
        priority: 'high',
      }
    }

    // 旗舰版 / 企业版：最高档，质量/速度/稳定性优先
    if (key === 'enterprise' || key === 'flagship' || key === 'vip') {
      return {
        budget: 'high',
        quality: 'max',
        speed: 'fast',
        priority: 'urgent',
      }
    }

    // 未知计划：默认走基础版策略
    return {
      budget: 'normal',
      quality: 'standard',
      speed: 'standard',
      priority: 'normal',
    }
  }

  /**
   * 使用 GPT 作为 Planner
   */
  private static async planWithGPT(
    request: CommanderRequest,
    model: string
  ): Promise<CommanderPlan> {
    const { OpenAI } = await import('openai').catch(() => {
      throw new Error(
        'openai package not installed. Run: npm install openai'
      )
    })

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const systemPrompt = this.buildSystemPrompt('gpt')
    const userContent = JSON.stringify({
      goal: request.goal,
      input: request.input,
      files: request.files,
      userProfile: request.userProfile,
      preferences: request.preferences,
      preferredTaskType: request.preferredTaskType,
    })

    const completion = await client.chat.completions.create({
      model: model === 'gpt-4' ? 'gpt-4' : model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' } as any,
      max_tokens: 1500,
    })

    const content = completion.choices[0]?.message?.content || ''
    return this.parsePlannerOutput(content, request)
  }

  /**
   * 使用 Gemini 作为 Planner
   */
  private static async planWithGemini(
    request: CommanderRequest,
    model: string
  ): Promise<CommanderPlan> {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const apiKey =
      process.env.GOOGLE_GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY

    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY is not configured')
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const modelId =
      model ||
      process.env.GOOGLE_GEMINI_MODEL ||
      'gemini-1.5-pro'

    const geminiModel = genAI.getGenerativeModel({ model: modelId })

    const systemPrompt = this.buildSystemPrompt('gemini')
    const userContent = JSON.stringify({
      goal: request.goal,
      input: request.input,
      files: request.files,
      userProfile: request.userProfile,
      preferences: request.preferences,
      preferredTaskType: request.preferredTaskType,
    })

    const result = await geminiModel.generateContent([
      {
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\nUSER_INPUT_JSON:\n${userContent}` }],
      } as any,
    ])

    const text = result.response.text()
    return this.parsePlannerOutput(text, request)
  }

  /**
   * 当没有大模型可用时，使用基于规则的简单规划
   */
  private static planWithHeuristics(request: CommanderRequest): CommanderPlan {
    const baseTaskType = this.inferTaskTypeFromGoal(
      request.goal,
      request.preferredTaskType
    )

    const steps: CommanderStep[] = []

    // 文本主任务
    if (baseTaskType === 'text') {
      steps.push({
        taskType: 'text',
        model: 'gpt-3.5',
        input: {
          prompt: request.goal,
          ...request.input,
        },
      })
    } else if (baseTaskType === 'image') {
      // 判断图像使用场景：照片级 / 商业创意 / 其他
      const imageUseCase = this.inferImageUseCaseFromGoal(request.goal)
      const isPhotoCritical = imageUseCase === 'photo-critical'

      // 先用文本模型写出详细提示词，再生成图片
      steps.push({
        taskType: 'text',
        model: 'gpt-3.5',
        input: {
          prompt: `根据这个目标生成详细的英文图像提示词（仅输出提示词本身）: ${request.goal}`,
          expectedQuality: isPhotoCritical ? 'high' : 'standard',
          useCase: imageUseCase,
        },
      })

      // 照片相关：优先使用高质量模型（如 stable-diffusion）
      // 广告/建筑/商业：可以使用性价比更高的模型（如 gemini-pro / flux）
      steps.push({
        taskType: 'image',
        model: isPhotoCritical ? 'stable-diffusion' : 'gemini-pro',
        input: {
          dependsOnField: 'prompt',
          expectedQuality: isPhotoCritical ? 'high' : 'standard',
          useCase: imageUseCase,
        },
        dependsOn: 0,
      })
    } else if (baseTaskType === 'video') {
      // 文本脚本 → 关键帧图像 → 视频
      steps.push({
        taskType: 'text',
        model: 'gpt-3.5',
        input: {
          prompt: `为这个目标编写详细的视频脚本和分镜（中文说明，输出 JSON 数组，每个元素包含 scene_prompt 字段）: ${request.goal}`,
        },
      })
      steps.push({
        taskType: 'image',
        model: 'gemini-pro',
        input: {
          dependsOnField: 'scenes',
        },
        dependsOn: 0,
      })
      steps.push({
        taskType: 'video',
        model: 'runway',
        input: {
          dependsOnField: 'storyboard',
        },
        dependsOn: 1,
      })
    } else {
      // 其他类型简单回退为文本
      steps.push({
        taskType: 'text',
        model: 'gpt-3.5',
        input: {
          prompt: request.goal,
          ...request.input,
        },
      })
    }

    return {
      id: `chain_${Date.now()}`,
      steps: steps.map(s => ({
        taskType: s.taskType,
        model: (s.model as ModelType | undefined),
        input: s.input,
        dependsOn: s.dependsOn,
      })),
    }
  }

  /**
   * 构造 Planner 的系统提示词
   */
  private static buildSystemPrompt(target: 'gpt' | 'gemini'): string {
    return [
      'You are an AI Orchestrator and Task Planner for a multi-model AI platform.',
      'Your job is to read the user goal + preferences and design a task chain.',
      '',
      'AVAILABLE TASK TYPES:',
      '- text: general reasoning, copywriting, analysis, code, planning',
      '- image: image generation from text or structured prompts',
      '- video: short video generation from text or storyboard',
      '- audio: speech / music (currently routed via external systems)',
      '- document: long document understanding / OCR',
      '- code: code generation / refactoring / explanation',
      '- composite: multi-modal workflows combining files and text',
      '',
      'AVAILABLE MODEL TYPES (logical level, final dispatch done by router):',
      '- gpt-4 / gpt-3.5',
      '- gemini-pro / gemini-flash',
      '- stable-diffusion / flux (image)',
      '- runway / pika / kling (video)',
      '- whisper (audio STT)',
      '- ocr (document OCR)',
      '',
      'IMPORTANT QUALITY / COST RULES:',
      '- Do NOT always start from the cheapest model; bad first results will hurt user trust.',
      '- For photo-critical scenarios (portraits, product photos, realistic photography, human faces, e-commerce main images, highly realistic lighting),',
      '  strongly prefer HIGH-QUALITY image models first (e.g. stable-diffusion / high-quality image backends).',
      '- For advertising, architecture, interior design, and general commercial creatives, cheaper models are more acceptable,',
      '  but still upgrade to higher quality models when the user emphasizes realism, print-quality, or premium branding.',
      '- Take into account the user plan and preferences: free users may be more cost-sensitive, but you must still avoid obviously bad quality.',
      '',
      'You must output STRICT JSON with the following shape:',
      '{',
      '  "steps": [',
      '    {',
      '      "taskType": "text" | "image" | "video" | "audio" | "document" | "code" | "composite",',
      '      "model": string,',
      '      "input": object,',
      '      "dependsOn": number | null',
      '    },',
      '    ...',
      '  ]',
      '}',
      '',
      'Rules:',
      '- Prefer minimal number of steps that still satisfy the goal.',
      '- Choose cheaper models (gemini-flash, gpt-3.5) for clearly low-budget / exploratory tasks,',
      '  EXCEPT when the goal is photo-critical or explicitly asks for very high quality.',
      '- Choose higher quality models (gpt-4, gemini-pro, high-end image models) for high quality / complex reasoning / premium outputs.',
      '- For image-first goals, consider text step to refine prompt, then image step.',
      '- For video goals, consider script → image storyboard → video pipeline.',
      '- Inputs must be concrete JSON objects (no comments, no undefined fields).',
      '',
      'Return ONLY the JSON. No explanations, no markdown.',
    ].join('\n')
  }

  /**
   * 解析 Planner 输出的 JSON，容错处理
   */
  private static parsePlannerOutput(
    rawContent: string,
    fallbackRequest: CommanderRequest
  ): CommanderPlan {
    try {
      const trimmed = rawContent.trim()
      const jsonStart = trimmed.indexOf('{')
      const jsonEnd = trimmed.lastIndexOf('}')
      const jsonString =
        jsonStart >= 0 && jsonEnd >= 0
          ? trimmed.slice(jsonStart, jsonEnd + 1)
          : trimmed

      const parsed = JSON.parse(jsonString) as { steps?: any[] }
      const steps = Array.isArray(parsed.steps) ? parsed.steps : []

      if (!steps.length) {
        throw new Error('Empty steps from planner')
      }

      const normalizedSteps: CommanderStep[] = steps.map((step, index) => ({
        taskType: (step.taskType || 'text') as TaskType,
        model: step.model as ModelType | string | undefined,
        input: step.input ?? {},
        dependsOn:
          typeof step.dependsOn === 'number' ? step.dependsOn : undefined,
      }))

      return {
        id: `chain_${Date.now()}`,
        steps: normalizedSteps.map(s => ({
          taskType: s.taskType,
          model: (s.model as ModelType | undefined),
          input: s.input,
          dependsOn: s.dependsOn,
        })),
      }
    } catch (error) {
      console.error('[AI Commander] Failed to parse planner output:', error)
      // 回退到基于规则的规划，确保系统始终可用
      return this.planWithHeuristics(fallbackRequest)
    }
  }

  /**
   * 从目标文本中粗略推断主任务类型
   */
  private static inferTaskTypeFromGoal(
    goal: string,
    preferred?: TaskType
  ): TaskType {
    if (preferred) return preferred

    const text = goal.toLowerCase()

    // 简单关键字判断（中文 + 英文）
    if (
      /视频|短视频|剪辑|clip|video|动画|sora|kling|runway/i.test(goal)
    ) {
      return 'video'
    }

    if (
      /图片|海报|封面|插画|banner|image|picture|midjourney|stable diffusion|wanxiang/i.test(
        goal
      )
    ) {
      return 'image'
    }

    if (/ppt|幻灯片|presentation|pdf|word|excel|文档|报告/i.test(goal)) {
      return 'document'
    }

    if (/代码|改造代码|重构|bug|debug|program|script|函数/i.test(goal)) {
      return 'code'
    }

    if (/音频|配音|语音|voice|music|bgm|背景音乐/i.test(goal)) {
      return 'audio'
    }

    if (/多模态|文件|图片和文字|图文|综合|analysis/i.test(goal)) {
      return 'composite'
    }

    return 'text'
  }

  /**
   * 针对图像任务，进一步判断使用场景：
   * - photo-critical: 人像 / 产品照 / 电商主图 / 高写实照片
   * - commercial-creative: 广告 / 建筑 / 室内 / 商业设计等
   * - generic: 其他通用场景
   */
  private static inferImageUseCaseFromGoal(
    goal: string,
  ): 'photo-critical' | 'commercial-creative' | 'generic' {
    const text = goal.toLowerCase()

    // 照片级、人像、产品图、电商主图等，对质量极其敏感
    if (
      /写真|人像|肖像|证件照|写真级|写实|逼真|realistic|photo\s*realistic|portrait|headshot|product photo|产品图|商品图|电商主图|主图|detail shot/i.test(
        goal,
      )
    ) {
      return 'photo-critical'
    }

    // 广告、建筑、室内、商业设计等，更偏创意/版式，可接受性价比模型
    if (
      /广告|海报|banner|kv|campaign|建筑|建筑效果图|室内|室内效果图|空间设计|商业|品牌|品牌设计|visual identity|vi|ui\s*design/i.test(
        goal,
      )
    ) {
      return 'commercial-creative'
    }

    return 'generic'
  }
}


