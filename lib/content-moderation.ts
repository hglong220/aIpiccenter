/**
 * 内容审核服务
 * 支持阿里云、腾讯云、百度等国内内容审核API
 */

export interface ModerationResult {
  passed: boolean
  riskLevel: 'pass' | 'review' | 'block'
  categories?: string[] // 检测到的违规类别
  reason?: string
  score?: number // 风险评分 0-100
}

export interface ModerationConfig {
  provider: 'aliyun' | 'tencent' | 'baidu' | 'mock'
  // 阿里云配置
  aliyunAccessKeyId?: string
  aliyunAccessKeySecret?: string
  aliyunRegion?: string
  // 腾讯云配置
  tencentSecretId?: string
  tencentSecretKey?: string
  tencentRegion?: string
  // 百度配置
  baiduApiKey?: string
  baiduSecretKey?: string
}

/**
 * 图像内容审核（阿里云）
 */
export async function moderateImageAliyun(
  imageUrl: string,
  config: ModerationConfig
): Promise<ModerationResult> {
  const { moderateImageAliyun: moderateImage } = await import('./moderation/aliyun')
  return moderateImage(
    imageUrl,
    config.aliyunAccessKeyId!,
    config.aliyunAccessKeySecret!,
    config.aliyunRegion
  )
}

/**
 * 图像内容审核（腾讯云）
 */
export async function moderateImageTencent(
  imageUrl: string,
  config: ModerationConfig
): Promise<ModerationResult> {
  const { moderateImageTencent: moderateImage } = await import('./moderation/tencent')
  return moderateImage(
    imageUrl,
    config.tencentSecretId!,
    config.tencentSecretKey!,
    config.tencentRegion
  )
}

/**
 * 文本内容审核
 */
export async function moderateText(
  text: string,
  config: ModerationConfig
): Promise<ModerationResult> {
  // 增强的关键词检测（生产环境应使用专业API）
  const blockedKeywords = {
    // 色情相关
    porn: ['色情', 'porn', 'xxx', 'nsfw', 'adult', 'sex', 'erotic'],
    // 暴力相关
    violence: ['暴力', 'violence', 'kill', 'murder', 'blood', 'gore', 'weapon'],
    // 恐怖相关
    terror: ['恐怖', 'terror', 'bomb', 'explosive', 'attack'],
    // 政治敏感
    political: ['政治', 'political', 'government', 'protest', 'revolution'],
    // 广告/垃圾
    spam: ['广告', 'spam', 'promotion', 'marketing', 'sales'],
    // 欺诈
    fraud: ['诈骗', 'fraud', 'scam', 'cheat', 'fake'],
  }
  
  const lowerText = text.toLowerCase()
  const foundCategories: string[] = []
  const foundKeywords: string[] = []
  
  // 检查每个类别
  for (const [category, keywords] of Object.entries(blockedKeywords)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        if (!foundCategories.includes(category)) {
          foundCategories.push(category)
        }
        foundKeywords.push(keyword)
      }
    }
  }
  
  // 计算风险评分
  let riskScore = 0
  if (foundCategories.includes('porn')) riskScore += 50
  if (foundCategories.includes('violence')) riskScore += 40
  if (foundCategories.includes('terror')) riskScore += 60
  if (foundCategories.includes('political')) riskScore += 30
  if (foundCategories.includes('spam')) riskScore += 10
  if (foundCategories.includes('fraud')) riskScore += 35
  
  // 根据风险评分决定是否通过
  if (riskScore >= 50) {
    return {
      passed: false,
      riskLevel: 'block',
      categories: foundCategories,
      reason: `检测到违规内容: ${foundCategories.join(', ')}`,
      score: riskScore,
    }
  } else if (riskScore >= 20) {
    return {
      passed: true,
      riskLevel: 'review',
      categories: foundCategories,
      reason: `需要人工审核: ${foundCategories.join(', ')}`,
      score: riskScore,
    }
  }
  
  return {
    passed: true,
    riskLevel: 'pass',
    score: riskScore,
  }
}

/**
 * 视频内容审核（抽帧 + OCR + ASR）
 */
export async function moderateVideo(
  videoUrl: string,
  config: ModerationConfig
): Promise<ModerationResult> {
  const { moderateVideo: moderateVideoImpl } = await import('./moderation/video')
  return moderateVideoImpl(videoUrl, config)
}

/**
 * 音频内容审核（Whisper → 文本）
 */
export async function moderateAudio(
  audioUrl: string,
  config: ModerationConfig
): Promise<ModerationResult & { transcribedText?: string }> {
  const { moderateAudio: moderateAudioImpl } = await import('./moderation/audio')
  return moderateAudioImpl(audioUrl, config)
}

/**
 * 统一的内容审核接口
 */
export async function moderateContent(
  type: 'image' | 'video' | 'text' | 'audio',
  content: string, // URL for image/video/audio, text for text
  config: ModerationConfig
): Promise<ModerationResult> {
  const startTime = Date.now()
  
  try {
    let result: ModerationResult
    
    if (config.provider === 'mock') {
      // 模拟审核（开发环境）- 文本仍然需要审核
      if (type === 'text') {
        result = await moderateText(content, config)
      } else {
        result = {
          passed: true,
          riskLevel: 'pass',
        }
      }
    } else {
      switch (type) {
        case 'image':
          if (config.provider === 'aliyun') {
            result = await moderateImageAliyun(content, config)
          } else if (config.provider === 'tencent') {
            result = await moderateImageTencent(content, config)
          } else {
            // 默认通过
            result = { passed: true, riskLevel: 'pass' }
          }
          break
        case 'video':
          result = await moderateVideo(content, config)
          break
        case 'audio':
          result = await moderateAudio(content, config)
          break
        case 'text':
          result = await moderateText(content, config)
          break
        default:
          result = { passed: true, riskLevel: 'pass' }
      }
    }
    
    const duration = Date.now() - startTime
    
    // 记录审核日志
    console.log(`[Content Moderation] ${type} moderation completed:`, {
      type,
      provider: config.provider,
      passed: result.passed,
      riskLevel: result.riskLevel,
      score: result.score,
      categories: result.categories,
      duration: `${duration}ms`,
    })
    
    return result
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[Content Moderation] Error moderating ${type}:`, error)
    
    // 审核失败时，根据类型决定是否通过
    // 文本审核失败应该更严格
    if (type === 'text') {
      return {
        passed: false,
        riskLevel: 'review',
        reason: '审核服务错误，需要人工审核',
      }
    }
    
    // 图像和视频审核失败时，允许通过但标记为需要审核
    return {
      passed: true,
      riskLevel: 'review',
      reason: '审核服务错误，已标记为待审核',
    }
  }
}

/**
 * 获取审核配置（从环境变量）
 */
export function getModerationConfig(): ModerationConfig {
  return {
    provider: (process.env.MODERATION_PROVIDER || 'mock') as ModerationConfig['provider'],
    // 阿里云
    aliyunAccessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
    aliyunAccessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
    aliyunRegion: process.env.ALIYUN_REGION || 'cn-shanghai',
    // 腾讯云
    tencentSecretId: process.env.TENCENT_SECRET_ID,
    tencentSecretKey: process.env.TENCENT_SECRET_KEY,
    tencentRegion: process.env.TENCENT_REGION || 'ap-shanghai',
    // 百度
    baiduApiKey: process.env.BAIDU_API_KEY,
    baiduSecretKey: process.env.BAIDU_SECRET_KEY,
  }
}

