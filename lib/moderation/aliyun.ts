/**
 * 阿里云内容安全审核占位实现
 *
 * 说明：
 * - 原始实现依赖 `@alicloud/green` 包，但该包在 npm 上不可用（会导致构建失败）。
 * - 为了保证项目可以正常构建和运行，这里提供一个“安全降级”的占位实现。
 * - 如果未来你拿到官方 SDK，可以在这里替换为真实实现。
 */

export interface AliyunModerationResult {
  passed: boolean
  riskLevel: 'pass' | 'review' | 'block'
  categories?: string[]
  reason?: string
  score?: number
}

/**
 * 图像审核（阿里云占位实现）
 *
 * 当前行为：
 * - 不调用任何外部服务
 * - 返回 `review` 状态，提示需要人工审核
 */
export async function moderateImageAliyun(
  imageUrl: string,
  accessKeyId: string,
  accessKeySecret: string,
  region: string = 'cn-shanghai'
): Promise<AliyunModerationResult> {
  console.warn(
    '[Aliyun Moderation] @alicloud/green SDK 未集成，已使用占位实现。' +
      '如果需要接入阿里云内容安全，请在 lib/moderation/aliyun.ts 中替换为真实实现。'
  )

  return {
    passed: true,
    riskLevel: 'review',
    reason: '阿里云内容安全未真正集成，已标记为待审核',
    score: 0,
  }
}

/**
 * 文本审核（阿里云占位实现）
 *
 * 当前行为：
 * - 不调用任何外部服务
 * - 返回 `review` 状态，提示需要人工审核
 */
export async function moderateTextAliyun(
  text: string,
  accessKeyId: string,
  accessKeySecret: string,
  region: string = 'cn-shanghai'
): Promise<AliyunModerationResult> {
  console.warn(
    '[Aliyun Moderation] @alicloud/green SDK 未集成，已使用占位实现。' +
      '如果需要接入阿里云内容安全，请在 lib/moderation/aliyun.ts 中替换为真实实现。'
  )

  return {
    passed: true,
    riskLevel: 'review',
    reason: '阿里云内容安全未真正集成，已标记为待审核',
    score: 0,
  }
}

