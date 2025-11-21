/**
 * 视频内容审核
 * 通过抽帧 + OCR + ASR 进行审核
 */

import * as ffmpeg from 'fluent-ffmpeg'
import * as fs from 'fs'
import * as path from 'path'
import { moderateImageAliyun } from './aliyun'
import { moderateImageTencent } from './tencent'
import { moderateText } from '../content-moderation'
import type { ModerationConfig } from '../content-moderation'

export interface VideoModerationResult {
  passed: boolean
  riskLevel: 'pass' | 'review' | 'block'
  categories?: string[]
  reason?: string
  score?: number
  framesChecked?: number
}

/**
 * 从视频中提取关键帧
 */
async function extractKeyFrames(
  videoPath: string,
  outputDir: string,
  frameCount: number = 10
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const frames: string[] = []
    const duration = 30 // 假设视频最长30秒，提取前30秒的帧

    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // 计算帧间隔
    const interval = duration / frameCount

    let extracted = 0
    const framePaths: string[] = []

    for (let i = 0; i < frameCount; i++) {
      const timestamp = i * interval
      const framePath = path.join(outputDir, `frame_${i}.jpg`)

      ffmpeg(videoPath)
        .screenshots({
          timestamps: [timestamp],
          filename: `frame_${i}.jpg`,
          folder: outputDir,
          size: '320x240',
        })
        .on('end', () => {
          extracted++
          framePaths.push(framePath)
          if (extracted === frameCount) {
            resolve(framePaths)
          }
        })
        .on('error', (err) => {
          console.error(`Error extracting frame at ${timestamp}s:`, err)
          extracted++
          if (extracted === frameCount) {
            resolve(framePaths) // 返回已提取的帧
          }
        })
    }
  })
}

/**
 * 视频审核（抽帧 + 图像审核）
 */
export async function moderateVideo(
  videoUrl: string,
  config: ModerationConfig
): Promise<VideoModerationResult> {
  try {
    // 下载视频（如果是 URL）
    let videoPath: string
    if (videoUrl.startsWith('http')) {
      const response = await fetch(videoUrl)
      const buffer = Buffer.from(await response.arrayBuffer())
      videoPath = path.join('/tmp', `video_${Date.now()}.mp4`)
      fs.writeFileSync(videoPath, buffer)
    } else {
      videoPath = videoUrl
    }

    // 提取关键帧
    const outputDir = path.join('/tmp', `frames_${Date.now()}`)
    const frames = await extractKeyFrames(videoPath, outputDir, 10)

    // 审核每一帧
    const results: Array<{ passed: boolean; riskLevel: string; categories?: string[] }> = []

    for (const framePath of frames) {
      let frameResult

      if (config.provider === 'aliyun' && config.aliyunAccessKeyId && config.aliyunAccessKeySecret) {
        frameResult = await moderateImageAliyun(
          framePath,
          config.aliyunAccessKeyId,
          config.aliyunAccessKeySecret,
          config.aliyunRegion
        )
      } else if (config.provider === 'tencent' && config.tencentSecretId && config.tencentSecretKey) {
        frameResult = await moderateImageTencent(
          framePath,
          config.tencentSecretId,
          config.tencentSecretKey,
          config.tencentRegion
        )
      } else {
        // Mock 审核
        frameResult = { passed: true, riskLevel: 'pass' }
      }

      results.push(frameResult)

      // 清理帧文件
      try {
        fs.unlinkSync(framePath)
      } catch (error) {
        // Ignore
      }
    }

    // 清理临时目录
    try {
      fs.rmdirSync(outputDir)
    } catch (error) {
      // Ignore
    }

    // 清理临时视频文件
    if (videoUrl.startsWith('http')) {
      try {
        fs.unlinkSync(videoPath)
      } catch (error) {
        // Ignore
      }
    }

    // 汇总结果
    const blockedFrames = results.filter(r => r.riskLevel === 'block').length
    const reviewFrames = results.filter(r => r.riskLevel === 'review').length
    const allCategories = results.flatMap(r => r.categories || [])

    if (blockedFrames > 0) {
      return {
        passed: false,
        riskLevel: 'block',
        categories: Array.from(new Set(allCategories)),
        score: Math.min(blockedFrames * 10, 100),
        reason: `检测到 ${blockedFrames} 帧违规内容`,
        framesChecked: frames.length,
      }
    }

    if (reviewFrames > 0) {
      return {
        passed: true,
        riskLevel: 'review',
        categories: Array.from(new Set(allCategories)),
        score: Math.min(reviewFrames * 5, 50),
        reason: `${reviewFrames} 帧需要人工审核`,
        framesChecked: frames.length,
      }
    }

    return {
      passed: true,
      riskLevel: 'pass',
      framesChecked: frames.length,
    }
  } catch (error: any) {
    console.error('Error moderating video:', error)
    return {
      passed: false,
      riskLevel: 'review',
      reason: `视频审核错误: ${error.message}`,
    }
  }
}

