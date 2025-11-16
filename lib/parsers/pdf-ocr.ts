/**
 * PDF OCR 解析
 * 将 PDF 转换为图像，然后进行 OCR
 */

import * as fs from 'fs'
import * as path from 'path'
import * as pdf2pic from 'pdf2pic'
import { recognizeText, recognizeTextAliyun } from '../ocr/tesseract'

export interface PDFOCRResult {
  text: string
  pages: Array<{
    pageNumber: number
    text: string
    confidence: number
  }>
  totalPages: number
}

/**
 * PDF OCR 解析（使用 Tesseract）
 */
export async function parsePDFWithOCR(
  pdfPath: string,
  options: {
    ocrProvider?: 'tesseract' | 'aliyun'
    aliyunAccessKeyId?: string
    aliyunAccessKeySecret?: string
    language?: string
  } = {}
): Promise<PDFOCRResult> {
  try {
    const { ocrProvider = 'tesseract', language = 'chi_sim+eng' } = options

    // 将 PDF 转换为图像
    const outputDir = path.join('/tmp', `pdf_images_${Date.now()}`)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // 使用 pdf2pic 转换（需要安装: npm install pdf2pic）
    let convert: any
    try {
      convert = require('pdf2pic').fromPath(pdfPath, {
        density: 300,
        saveFilename: 'page',
        savePath: outputDir,
        format: 'png',
        width: 2000,
        height: 2000,
      })
    } catch (error) {
      console.warn('pdf2pic not installed, using alternative method')
      // 使用其他方法转换 PDF
      throw new Error('PDF转图像需要安装 pdf2pic: npm install pdf2pic')
    }

    // 获取 PDF 页数（简化版）
    const pdfParse = await import('pdf-parse').catch(() => null)
    let totalPages = 1
    if (pdfParse) {
      const pdfBuffer = fs.readFileSync(pdfPath)
      const pdfData = await pdfParse.default(pdfBuffer)
      totalPages = pdfData.numpages
    }

    const pages: Array<{ pageNumber: number; text: string; confidence: number }> = []

    // 对每一页进行 OCR
    for (let i = 1; i <= totalPages; i++) {
      try {
        const imagePath = path.join(outputDir, `page.${i}.png`)
        
        // 如果图像不存在，转换这一页
        if (!fs.existsSync(imagePath)) {
          await convert(i, { responseType: 'image' })
        }

        // OCR 识别
        let ocrResult
        if (ocrProvider === 'aliyun' && options.aliyunAccessKeyId && options.aliyunAccessKeySecret) {
          ocrResult = await recognizeTextAliyun(
            imagePath,
            options.aliyunAccessKeyId,
            options.aliyunAccessKeySecret
          )
        } else {
          ocrResult = await recognizeText(imagePath, language)
        }

        pages.push({
          pageNumber: i,
          text: ocrResult.text,
          confidence: ocrResult.confidence,
        })

        // 清理临时图像
        try {
          fs.unlinkSync(imagePath)
        } catch (error) {
          // Ignore
        }
      } catch (error: any) {
        console.warn(`[PDF OCR] Page ${i} failed:`, error.message)
        pages.push({
          pageNumber: i,
          text: '',
          confidence: 0,
        })
      }
    }

    // 清理临时目录
    try {
      fs.rmdirSync(outputDir)
    } catch (error) {
      // Ignore
    }

    // 合并所有页面的文本
    const fullText = pages.map(p => p.text).join('\n\n')

    return {
      text: fullText,
      pages,
      totalPages,
    }
  } catch (error: any) {
    console.error('[PDF OCR] Error:', error)
    throw new Error(`PDF OCR解析失败: ${error.message}`)
  }
}

