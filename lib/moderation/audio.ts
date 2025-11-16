/**
 * 音频内容审核
 * 通过 Whisper 转文本，然后进行文本审核
 */

import * as fs from 'fs'
import { moderateText } from '../content-moderation'
import type { ModerationConfig } from '../content-moderation'

export interface AudioModerationResult {
  passed: boolean
  riskLevel: 'pass' | 'review' | 'block'
  categories?: string[]
  reason?: string
  score?: number
  transcribedText?: string
}

/**
 * 使用 Whisper 转文本
 * 注意：需要配置 OpenAI API 或使用本地 Whisper 模型
 */
async function transcribeAudio(
  audioPath: string,
  apiKey?: string
): Promise<string> {
  try {
    // 如果配置了 OpenAI API Key，使用 OpenAI Whisper
    if (apiKey) {
      const FormData = require('form-data')
      const formData = new FormData()
      formData.append('file', fs.createReadStream(audioPath))
      formData.append('model', 'whisper-1')

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        return data.text || ''
      }
    }

    // 如果没有配置 API Key，返回空字符串（需要人工审核）
    console.warn('OpenAI API Key not configured, audio moderation will require manual review')
    return ''
  } catch (error: any) {
    console.error('Error transcribing audio:', error)
    return ''
  }
}

/**
 * 音频审核（Whisper → 文本审核）
 */
export async function moderateAudio(
  audioUrl: string,
  config: ModerationConfig
): Promise<AudioModerationResult> {
  try {
    // 下载音频（如果是 URL）
    let audioPath: string
    if (audioUrl.startsWith('http')) {
      const response = await fetch(audioUrl)
      const buffer = Buffer.from(await response.arrayBuffer())
      audioPath = `/tmp/audio_${Date.now()}.wav`
      fs.writeFileSync(audioPath, buffer)
    } else {
      audioPath = audioUrl
    }

    // 转文本
    const openaiApiKey = process.env.OPENAI_API_KEY
    const transcribedText = await transcribeAudio(audioPath, openaiApiKey)

    // 清理临时文件
    if (audioUrl.startsWith('http')) {
      try {
        fs.unlinkSync(audioPath)
      } catch (error) {
        // Ignore
      }
    }

    // 如果没有转文本成功，标记为需要人工审核
    if (!transcribedText) {
      return {
        passed: true,
        riskLevel: 'review',
        reason: '音频转文本失败，需要人工审核',
      }
    }

    // 文本审核
    const textResult = await moderateText(transcribedText, config)

    return {
      ...textResult,
      transcribedText,
    }
  } catch (error: any) {
    console.error('Error moderating audio:', error)
    return {
      passed: false,
      riskLevel: 'review',
      reason: `音频审核错误: ${error.message}`,
    }
  }
}

