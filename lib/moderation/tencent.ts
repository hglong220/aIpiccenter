/**
 * 腾讯云内容安全审核
 * 需要安装: npm install tencentcloud-sdk-nodejs
 */

import * as fs from 'fs'

export interface TencentModerationResult {
  passed: boolean
  riskLevel: 'pass' | 'review' | 'block'
  categories?: string[]
  reason?: string
  score?: number
}

/**
 * 图像审核（腾讯云）
 */
export async function moderateImageTencent(
  imageUrl: string,
  secretId: string,
  secretKey: string,
  region: string = 'ap-shanghai'
): Promise<TencentModerationResult> {
  try {
    // 尝试动态导入腾讯云 SDK
    let tencentcloud: any
    try {
      tencentcloud = require('tencentcloud-sdk-nodejs')
    } catch (error) {
      console.warn('tencentcloud-sdk-nodejs not installed, using mock implementation')
      return {
        passed: true,
        riskLevel: 'pass',
        reason: '腾讯云 SDK 未安装，使用模拟审核',
      }
    }

    const { ImageModerationClient, Models } = tencentcloud.ims.v20201229

    const client = new ImageModerationClient({
      credential: {
        secretId,
        secretKey,
      },
      region,
    })

    // 读取图片数据
    let imageData: Buffer
    if (imageUrl.startsWith('http')) {
      const response = await fetch(imageUrl)
      imageData = Buffer.from(await response.arrayBuffer())
    } else {
      imageData = fs.readFileSync(imageUrl)
    }

    const params = {
      ImageUrl: imageUrl.startsWith('http') ? imageUrl : undefined,
      ImageBase64: imageUrl.startsWith('http') ? undefined : imageData.toString('base64'),
      BizType: 'default',
    }

    const result = await client.ImageModeration(params)

    if (result.Suggestion) {
      const suggestion = result.Suggestion.toLowerCase()
      const labels = result.LabelResults?.map((r: any) => r.Label) || []

      return {
        passed: suggestion === 'pass',
        riskLevel: suggestion === 'block' ? 'block' : suggestion === 'review' ? 'review' : 'pass',
        categories: labels,
        score: result.Score || 0,
        reason: result.SubLabel,
      }
    }

    return {
      passed: true,
      riskLevel: 'pass',
    }
  } catch (error: any) {
    console.error('Error moderating image with Tencent:', error)
    return {
      passed: false,
      riskLevel: 'review',
      reason: `审核服务错误: ${error.message}`,
    }
  }
}

/**
 * 文本审核（腾讯云）
 */
export async function moderateTextTencent(
  text: string,
  secretId: string,
  secretKey: string,
  region: string = 'ap-shanghai'
): Promise<TencentModerationResult> {
  try {
    let tencentcloud: any
    try {
      tencentcloud = require('tencentcloud-sdk-nodejs')
    } catch (error) {
      console.warn('tencentcloud-sdk-nodejs not installed, using mock implementation')
      return {
        passed: true,
        riskLevel: 'pass',
        reason: '腾讯云 SDK 未安装，使用模拟审核',
      }
    }

    const { TextModerationClient } = tencentcloud.tms.v20201229

    const client = new TextModerationClient({
      credential: {
        secretId,
        secretKey,
      },
      region,
    })

    const params = {
      Content: text,
      BizType: 'default',
    }

    const result = await client.TextModeration(params)

    if (result.Suggestion) {
      const suggestion = result.Suggestion.toLowerCase()
      const labels = result.LabelResults?.map((r: any) => r.Label) || []

      return {
        passed: suggestion === 'pass',
        riskLevel: suggestion === 'block' ? 'block' : suggestion === 'review' ? 'review' : 'pass',
        categories: labels,
        score: result.Score || 0,
        reason: result.SubLabel,
      }
    }

    return {
      passed: true,
      riskLevel: 'pass',
    }
  } catch (error: any) {
    console.error('Error moderating text with Tencent:', error)
    return {
      passed: false,
      riskLevel: 'review',
      reason: `审核服务错误: ${error.message}`,
    }
  }
}

