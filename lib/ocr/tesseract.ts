/**
 * Tesseract OCR 实现
 * 需要安装: npm install tesseract.js
 */

import * as fs from 'fs'
import * as path from 'path'

export interface OCRResult {
  text: string
  confidence: number
  words?: Array<{
    text: string
    confidence: number
    bbox: { x: number; y: number; width: number; height: number }
  }>
}

/**
 * OCR 识别（使用 Tesseract.js）
 */
export async function recognizeText(imagePath: string, language: string = 'chi_sim+eng'): Promise<OCRResult> {
  try {
    // 动态导入 Tesseract.js
    let Tesseract: any
    try {
      Tesseract = require('tesseract.js')
    } catch (error) {
      console.warn('tesseract.js not installed, using mock OCR')
      return {
        text: '[OCR功能需要安装 tesseract.js]',
        confidence: 0,
      }
    }

    const { createWorker } = Tesseract
    const worker = await createWorker(language)

    try {
      const { data } = await worker.recognize(imagePath)
      
      await worker.terminate()

      return {
        text: data.text,
        confidence: data.confidence || 0,
        words: data.words?.map((w: any) => ({
          text: w.text,
          confidence: w.confidence,
          bbox: w.bbox,
        })),
      }
    } catch (error: any) {
      await worker.terminate()
      throw error
    }
  } catch (error: any) {
    console.error('[OCR] Error recognizing text:', error)
    throw new Error(`OCR识别失败: ${error.message}`)
  }
}

/**
 * OCR 识别（使用阿里云 OCR API）
 */
export async function recognizeTextAliyun(
  imagePath: string,
  accessKeyId: string,
  accessKeySecret: string,
  region: string = 'cn-shanghai'
): Promise<OCRResult> {
  try {
    // 读取图片
    const imageBuffer = fs.readFileSync(imagePath)
    const imageBase64 = imageBuffer.toString('base64')

    // 调用阿里云 OCR API
    // 注意：实际 API 端点需要根据阿里云文档调整
    const response = await fetch(`https://ocr-api.cn-shanghai.aliyuncs.com/v1/recognize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessKeyId}`, // 简化版，实际需要签名
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageBase64,
        type: 'general', // 通用文字识别
      }),
    })

    if (!response.ok) {
      throw new Error(`OCR API failed: ${response.status}`)
    }

    const data = await response.json()
    
    return {
      text: data.content || '',
      confidence: data.confidence || 0,
      words: data.words?.map((w: any) => ({
        text: w.text,
        confidence: w.confidence,
        bbox: w.bbox,
      })),
    }
  } catch (error: any) {
    console.error('[OCR] Error recognizing text with Aliyun:', error)
    throw new Error(`阿里云OCR识别失败: ${error.message}`)
  }
}

