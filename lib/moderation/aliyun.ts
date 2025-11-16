/**
 * 阿里云内容安全审核
 * 需要安装: npm install @alicloud/green
 */

import * as fs from 'fs'
import * as path from 'path'

export interface AliyunModerationResult {
  passed: boolean
  riskLevel: 'pass' | 'review' | 'block'
  categories?: string[]
  reason?: string
  score?: number
}

/**
 * 图像审核（阿里云）
 */
export async function moderateImageAliyun(
  imageUrl: string,
  accessKeyId: string,
  accessKeySecret: string,
  region: string = 'cn-shanghai'
): Promise<AliyunModerationResult> {
  try {
    // 尝试动态导入 @alicloud/green
    let Green: any
    try {
      Green = require('@alicloud/green')
    } catch (error) {
      console.error('@alicloud/green not installed. Please install it: npm install @alicloud/green')
      // 不再使用mock，直接抛出错误要求安装SDK
      throw new Error('阿里云内容安全SDK未安装，请运行: npm install @alicloud/green')
    }

    // 读取图片数据
    let imageData: Buffer
    if (imageUrl.startsWith('http')) {
      const response = await fetch(imageUrl)
      imageData = Buffer.from(await response.arrayBuffer())
    } else {
      imageData = fs.readFileSync(imageUrl)
    }

    // 调用阿里云内容安全 API
    // 注意：这里需要根据实际 API 文档调整
    const client = new Green({
      accessKeyId,
      accessKeySecret,
      region,
    })

    // 图像审核 API 调用
    const result = await client.imageSyncScan({
      scenes: ['porn', 'terrorism', 'ad', 'qrcode', 'live', 'logo'],
      tasks: [
        {
          dataId: Date.now().toString(),
          url: imageUrl.startsWith('http') ? imageUrl : undefined,
          content: imageUrl.startsWith('http') ? undefined : imageData.toString('base64'),
        },
      ],
    })

    // 解析结果
    if (result.code === 200 && result.data) {
      const taskResult = result.data[0]
      const riskLevel = taskResult.suggestion || 'pass'
      const labels = taskResult.results?.map((r: any) => r.label) || []

      return {
        passed: riskLevel === 'pass',
        riskLevel: riskLevel === 'block' ? 'block' : riskLevel === 'review' ? 'review' : 'pass',
        categories: labels,
        score: taskResult.results?.[0]?.rate || 0,
        reason: taskResult.results?.[0]?.msg,
      }
    }

    return {
      passed: true,
      riskLevel: 'pass',
    }
  } catch (error: any) {
    console.error('Error moderating image with Aliyun:', error)
    return {
      passed: false,
      riskLevel: 'review',
      reason: `审核服务错误: ${error.message}`,
    }
  }
}

/**
 * 文本审核（阿里云）
 */
export async function moderateTextAliyun(
  text: string,
  accessKeyId: string,
  accessKeySecret: string,
  region: string = 'cn-shanghai'
): Promise<AliyunModerationResult> {
  try {
    let Green: any
    try {
      Green = require('@alicloud/green')
    } catch (error) {
      console.error('@alicloud/green not installed. Please install it: npm install @alicloud/green')
      // 不再使用mock，直接抛出错误要求安装SDK
      throw new Error('阿里云内容安全SDK未安装，请运行: npm install @alicloud/green')
    }

    const client = new Green({
      accessKeyId,
      accessKeySecret,
      region,
    })

    const result = await client.textScan({
      scenes: ['antispam'],
      tasks: [
        {
          dataId: Date.now().toString(),
          content: text,
        },
      ],
    })

    if (result.code === 200 && result.data) {
      const taskResult = result.data[0]
      const riskLevel = taskResult.suggestion || 'pass'

      return {
        passed: riskLevel === 'pass',
        riskLevel: riskLevel === 'block' ? 'block' : riskLevel === 'review' ? 'review' : 'pass',
        categories: taskResult.results?.map((r: any) => r.label) || [],
        score: taskResult.results?.[0]?.rate || 0,
        reason: taskResult.results?.[0]?.msg,
      }
    }

    return {
      passed: true,
      riskLevel: 'pass',
    }
  } catch (error: any) {
    console.error('Error moderating text with Aliyun:', error)
    return {
      passed: false,
      riskLevel: 'review',
      reason: `审核服务错误: ${error.message}`,
    }
  }
}

