/**
 * 内容审核中间件
 * 拦截违规内容，提示用户修改
 */

import { moderateContent, getModerationConfig, type ModerationResult } from './content-moderation'
import { prisma } from './prisma'

export interface ModerationLog {
  id: string
  userId: string
  contentType: 'text' | 'image' | 'video' | 'audio'
  content: string // URL或文本内容
  result: ModerationResult
  action: 'pass' | 'block' | 'review'
  createdAt: Date
}

/**
 * 审核文本内容
 */
export async function moderateTextContent(
  userId: string,
  text: string
): Promise<{ passed: boolean; reason?: string; logId?: string }> {
  const config = getModerationConfig()
  const result = await moderateContent('text', text, config)

  // 记录审核日志
  const log = await prisma.moderationLog.create({
    data: {
      userId,
      contentType: 'text',
      content: text.substring(0, 500), // 只保存前500字符
      riskLevel: result.riskLevel,
      categories: result.categories ? JSON.stringify(result.categories) : null,
      score: result.score || 0,
      passed: result.passed,
      reason: result.reason || null,
      action: result.passed ? 'pass' : (result.riskLevel === 'block' ? 'block' : 'review'),
    },
  })

  if (!result.passed) {
    return {
      passed: false,
      reason: result.reason || '内容不符合规范，请修改后重试',
      logId: log.id,
    }
  }

  return { passed: true, logId: log.id }
}

/**
 * 审核图像内容
 */
export async function moderateImageContent(
  userId: string,
  imageUrl: string
): Promise<{ passed: boolean; reason?: string; logId?: string }> {
  const config = getModerationConfig()
  const result = await moderateContent('image', imageUrl, config)

  // 记录审核日志
  const log = await prisma.moderationLog.create({
    data: {
      userId,
      contentType: 'image',
      content: imageUrl,
      riskLevel: result.riskLevel,
      categories: result.categories ? JSON.stringify(result.categories) : null,
      score: result.score || 0,
      passed: result.passed,
      reason: result.reason || null,
      action: result.passed ? 'pass' : (result.riskLevel === 'block' ? 'block' : 'review'),
    },
  })

  if (!result.passed) {
    return {
      passed: false,
      reason: result.reason || '图像内容不符合规范',
      logId: log.id,
    }
  }

  return { passed: true, logId: log.id }
}

/**
 * 审核视频内容
 */
export async function moderateVideoContent(
  userId: string,
  videoUrl: string
): Promise<{ passed: boolean; reason?: string; logId?: string }> {
  const config = getModerationConfig()
  const result = await moderateContent('video', videoUrl, config)

  // 记录审核日志
  const log = await prisma.moderationLog.create({
    data: {
      userId,
      contentType: 'video',
      content: videoUrl,
      riskLevel: result.riskLevel,
      categories: result.categories ? JSON.stringify(result.categories) : null,
      score: result.score || 0,
      passed: result.passed,
      reason: result.reason || null,
      action: result.passed ? 'pass' : (result.riskLevel === 'block' ? 'block' : 'review'),
    },
  })

  if (!result.passed) {
    return {
      passed: false,
      reason: result.reason || '视频内容不符合规范',
      logId: log.id,
    }
  }

  return { passed: true, logId: log.id }
}

/**
 * 审核中间件 - 用于API路由
 */
export async function moderationMiddleware(
  userId: string,
  contentType: 'text' | 'image' | 'video' | 'audio',
  content: string
): Promise<{ passed: boolean; error?: string }> {
  try {
    let result: { passed: boolean; reason?: string; logId?: string }

    switch (contentType) {
      case 'text':
        result = await moderateTextContent(userId, content)
        break
      case 'image':
        result = await moderateImageContent(userId, content)
        break
      case 'video':
        result = await moderateVideoContent(userId, content)
        break
      default:
        return { passed: true } // 音频审核暂时通过
    }

    if (!result.passed) {
      return {
        passed: false,
        error: result.reason || '内容审核未通过',
      }
    }

    return { passed: true }
  } catch (error) {
    console.error('[Moderation Middleware] Error:', error)
    // 审核失败时，根据类型决定是否通过
    // 文本审核失败应该更严格
    if (contentType === 'text') {
      return {
        passed: false,
        error: '内容审核服务错误，请稍后重试',
      }
    }
    // 图像和视频审核失败时，允许通过但标记为需要审核
    return { passed: true }
  }
}

