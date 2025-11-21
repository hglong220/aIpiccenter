/**
 * GPT多模态解析链
 * 支持文档、图像、视频、音频的解析
 */

import { prisma } from './prisma'
import type { FileMetadata } from '@/types'

// 解析结果接口
export interface ParseResult {
  type: 'document' | 'image' | 'video' | 'audio' | 'code'
  text?: string
  metadata?: FileMetadata
  extractedData?: any
  error?: string
}

/**
 * 解析文档（PDF、PPT、Word、Excel）
 */
export async function parseDocument(fileId: string): Promise<ParseResult> {
  try {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: { metadata: true },
    })

    if (!file) {
      throw new Error('文件不存在')
    }

    const mimeType = file.mimeType.toLowerCase()
    let result: ParseResult = {
      type: 'document',
      metadata: file.metadata as any,
    }

    // PDF解析
    if (mimeType === 'application/pdf') {
      result = await parsePDF(file)
    }
    // Word文档解析
    else if (mimeType.includes('word') || mimeType.includes('document')) {
      result = await parseWord(file)
    }
    // PowerPoint解析
    else if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
      result = await parsePPT(file)
    }
    // Excel解析
    else if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      result = await parseExcel(file)
    }
    // 纯文本
    else if (mimeType.includes('text')) {
      result = await parseText(file)
    }
    else {
      throw new Error(`不支持的文档类型: ${mimeType}`)
    }

    // 更新文件元数据
    if (result.text && file.metadata) {
      // 如果文本太长，分段处理
      const { segmentDocument } = await import('./parsers/document-segmenter')
      const segments = segmentDocument(result.text, {
        maxTokens: 2000,
        overlap: 200,
        preserveParagraphs: true,
      })

      await prisma.fileMetadata.update({
        where: { id: file.metadata.id },
        data: {
          extractedText: result.text,
          wordCount: result.text.split(/\s+/).length,
          extraMetadata: JSON.stringify({
            segments: segments.map(s => ({
              id: s.id,
              tokenCount: s.tokenCount,
              startIndex: s.startIndex,
              endIndex: s.endIndex,
            })),
          }),
        },
      })
    }

    return result
  } catch (error) {
    console.error('[Multimodal Parser] Error parsing document:', error)
    return {
      type: 'document',
      error: error instanceof Error ? error.message : '解析失败',
    }
  }
}

/**
 * 解析PDF
 */
async function parsePDF(file: any): Promise<ParseResult> {
  try {
    // 检查是否是扫描PDF（需要OCR）
    const isScanned = await checkIfScannedPDF(file)
    
    if (isScanned) {
      // 使用OCR解析
      return await parsePDFWithOCR(file)
    } else {
      // 使用文本提取
      return await parsePDFText(file)
    }
  } catch (error) {
    throw new Error(`PDF解析失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * 检查PDF是否是扫描件
 */
async function checkIfScannedPDF(file: any): Promise<boolean> {
  // 简单实现：检查文件大小，扫描PDF通常较大
  // 实际应该检查PDF中是否包含文本层
  return file.size > 5 * 1024 * 1024 // 大于5MB可能是扫描件
}

/**
 * PDF文本提取
 */
async function parsePDFText(file: any): Promise<ParseResult> {
  try {
    // 需要安装 pdf-parse: npm install pdf-parse
    let pdfParse: any
    try {
      pdfParse = await import('pdf-parse')
    } catch (error) {
      console.error('pdf-parse未安装，请运行: npm install pdf-parse')
      throw new Error('pdf-parse未安装，请运行: npm install pdf-parse')
    }

    // 读取文件
    const fs = await import('fs/promises')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'storage', file.storagePath)
    const fileBuffer = await fs.readFile(filePath)

    // 解析PDF
    const pdfData = await pdfParse.default(fileBuffer)
    
    return {
      type: 'document',
      text: pdfData.text,
      metadata: {
        document: {
          pageCount: pdfData.numpages,
          wordCount: pdfData.text.split(/\s+/).length,
        },
      },
    }
  } catch (error) {
    throw new Error(`PDF文本提取失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * PDF OCR解析
 */
async function parsePDFWithOCR(file: any): Promise<ParseResult> {
  try {
    const fs = await import('fs/promises')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'storage', file.storagePath)
    
    const { parsePDFWithOCR: parsePDFOCR } = await import('./parsers/pdf-ocr')
    
    // 检查是否配置了阿里云 OCR
    const ocrProvider = process.env.OCR_PROVIDER || 'tesseract'
    const options: any = {
      ocrProvider,
      language: 'chi_sim+eng',
    }

    if (ocrProvider === 'aliyun') {
      options.aliyunAccessKeyId = process.env.ALIYUN_ACCESS_KEY_ID
      options.aliyunAccessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET
    }

    const result = await parsePDFOCR(filePath, options)
    
    return {
      type: 'document',
      text: result.text,
      metadata: {
        document: {
          pageCount: result.totalPages,
          wordCount: result.text.split(/\s+/).length,
        },
      },
      extractedData: {
        pages: result.pages,
      },
    }
  } catch (error) {
    throw new Error(`PDF OCR失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * 解析Word文档
 */
async function parseWord(file: any): Promise<ParseResult> {
  try {
    // 需要安装 mammoth: npm install mammoth
    let mammoth: any
    try {
      mammoth = await import('mammoth')
    } catch (error) {
      console.error('mammoth未安装，请运行: npm install mammoth')
      throw new Error('mammoth未安装，请运行: npm install mammoth')
    }

    const fs = await import('fs/promises')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'storage', file.storagePath)
    const fileBuffer = await fs.readFile(filePath)

    const result = await mammoth.extractRawText({ buffer: fileBuffer })
    
    return {
      type: 'document',
      text: result.value,
      metadata: {
        document: {
          wordCount: result.value.split(/\s+/).length,
        },
      },
    }
  } catch (error) {
    throw new Error(`Word解析失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * 解析PowerPoint
 */
async function parsePPT(file: any): Promise<ParseResult> {
  try {
    const fs = await import('fs/promises')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'storage', file.storagePath)
    
    const { parsePPT: parsePPTFile } = await import('./parsers/ppt')
    const result = await parsePPTFile(filePath)
    
    // 合并所有幻灯片的文本
    const fullText = result.slides.map(s => `幻灯片 ${s.slideNumber}:\n${s.text}`).join('\n\n')
    
    return {
      type: 'document',
      text: fullText,
      metadata: {
        document: {
          pageCount: result.totalSlides,
          wordCount: fullText.split(/\s+/).length,
        },
      },
      extractedData: {
        slides: result.slides,
      },
    }
  } catch (error) {
    throw new Error(`PPT解析失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * 解析Excel (使用exceljs替代xlsx，修复安全漏洞)
 */
async function parseExcel(file: any): Promise<ParseResult> {
  try {
    // 使用 exceljs 替代 xlsx (修复安全漏洞)
    const ExcelJS = await import('exceljs').catch(() => null)
    
    if (!ExcelJS) {
      throw new Error('exceljs未安装，请运行: npm install exceljs')
    }

    const fs = await import('fs/promises')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'storage', file.storagePath)
    const fileBuffer = await fs.readFile(filePath)

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(fileBuffer)
    
    // 转换为JSON
    const sheets: Record<string, any[]> = {}
    
    workbook.eachSheet((worksheet, sheetId) => {
      const sheetData: any[] = []
      let headers: string[] = []
      let isFirstRow = true
      
      worksheet.eachRow((row, rowNumber) => {
        if (isFirstRow) {
          // 提取第一行作为标题
          headers = []
          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            headers[colNumber - 1] = String(cell.value || `col${colNumber}`)
          })
          isFirstRow = false
          return
        }
        
        // 将行数据转换为对象
        const rowData: any = {}
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const header = headers[colNumber - 1] || `col${colNumber}`
          rowData[header] = cell.value
        })
        
        // 只添加非空行
        if (Object.keys(rowData).some(key => rowData[key] !== undefined && rowData[key] !== null && rowData[key] !== '')) {
          sheetData.push(rowData)
        }
      })
      
      sheets[worksheet.name] = sheetData
    })
    
    return {
      type: 'document',
      extractedData: sheets,
      metadata: {
        document: {
          pageCount: workbook.worksheets.length,
        },
      },
    }
  } catch (error) {
    throw new Error(`Excel解析失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * 解析纯文本
 */
async function parseText(file: any): Promise<ParseResult> {
  try {
    const fs = await import('fs/promises')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'storage', file.storagePath)
    const text = await fs.readFile(filePath, 'utf-8')
    
    return {
      type: 'document',
      text,
      metadata: {
        document: {
          wordCount: text.split(/\s+/).length,
        },
      },
    }
  } catch (error) {
    throw new Error(`文本解析失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * 解析图像
 */
export async function parseImage(fileId: string): Promise<ParseResult> {
  try {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: { metadata: true },
    })

    if (!file) {
      throw new Error('文件不存在')
    }

    // 图像预处理和元数据提取已经在文件上传时完成
    // 这里主要用于图像内容分析（使用GPT Vision）
    
    return {
      type: 'image',
      metadata: file.metadata as any,
    }
  } catch (error) {
    return {
      type: 'image',
      error: error instanceof Error ? error.message : '解析失败',
    }
  }
}

/**
 * 解析视频（抽帧 + OCR + ASR）
 */
export async function parseVideo(fileId: string): Promise<ParseResult> {
  try {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: { metadata: true },
    })

    if (!file) {
      throw new Error('文件不存在')
    }

    const fs = await import('fs/promises')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'storage', file.storagePath)

    // 1. 提取关键帧
    const { extractKeyFrames } = await import('./video-processor')
    const framesDir = path.join('/tmp', `frames_${Date.now()}`)
    const frames = await extractKeyFrames(filePath, framesDir, 10)

    // 2. 对每一帧进行 OCR
    const { recognizeText } = await import('./ocr/tesseract')
    const frameTexts: string[] = []
    
    for (const framePath of frames) {
      try {
        const ocrResult = await recognizeText(framePath, 'chi_sim+eng')
        if (ocrResult.text.trim()) {
          frameTexts.push(ocrResult.text)
        }
        // 清理临时帧
        fs.unlink(framePath).catch(() => {})
      } catch (error) {
        // Ignore OCR errors for individual frames
      }
    }

    // 3. 提取音频并转文本（ASR）
    const audioText = await extractAudioFromVideo(filePath)

    // 合并所有文本
    const fullText = [
      ...frameTexts,
      audioText ? `音频转文本:\n${audioText}` : '',
    ].filter(t => t.trim()).join('\n\n')

    // 清理临时目录
    try {
      fs.rmdir(framesDir).catch(() => {})
    } catch (error) {
      // Ignore
    }

    return {
      type: 'video',
      text: fullText,
      metadata: file.metadata as any,
      extractedData: {
        framesExtracted: frames.length,
        framesWithText: frameTexts.length,
        hasAudioText: !!audioText,
      },
    }
  } catch (error) {
    return {
      type: 'video',
      error: error instanceof Error ? error.message : '解析失败',
    }
  }
}

/**
 * 从视频提取音频并转文本
 */
async function extractAudioFromVideo(videoPath: string): Promise<string> {
  try {
    const ffmpeg = await import('fluent-ffmpeg')
    const fs = await import('fs/promises')
    const path = await import('path')

    // 提取音频
    const audioPath = path.join('/tmp', `audio_${Date.now()}.wav`)
    
    await new Promise<void>((resolve, reject) => {
      ffmpeg.default(videoPath)
        .audioCodec('pcm_s16le')
        .audioFrequency(16000)
        .audioChannels(1)
        .format('wav')
        .on('end', resolve)
        .on('error', reject)
        .save(audioPath)
    })

    // 使用 Whisper 转文本
    const { moderateAudio } = await import('./moderation/audio')
    const transcribedText = await moderateAudio(audioPath, {
      provider: 'mock', // 这里应该使用真实的 Whisper API
    } as any)

    // 清理临时音频文件
    try {
      await fs.unlink(audioPath)
    } catch (error) {
      // Ignore
    }

    return transcribedText.transcribedText || ''
  } catch (error: any) {
    console.warn('[Video Parser] Audio extraction failed:', error.message)
    return ''
  }
}

/**
 * 解析音频（Whisper 转文本 + 降噪）
 */
export async function parseAudio(fileId: string): Promise<ParseResult> {
  try {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: { metadata: true },
    })

    if (!file) {
      throw new Error('文件不存在')
    }

    const fs = await import('fs/promises')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'storage', file.storagePath)

    // 1. 转码到标准格式（wav/16kHz）
    const normalizedAudioPath = await normalizeAudio(filePath)

    // 2. 降噪（可选）
    const denoisedAudioPath = await denoiseAudio(normalizedAudioPath)

    // 3. 使用 Whisper 转文本
    const transcribedText = await transcribeAudioWithWhisper(denoisedAudioPath || normalizedAudioPath)

    // 清理临时文件
    try {
      if (normalizedAudioPath !== filePath) {
        await fs.unlink(normalizedAudioPath).catch(() => {})
      }
      if (denoisedAudioPath && denoisedAudioPath !== normalizedAudioPath) {
        await fs.unlink(denoisedAudioPath).catch(() => {})
      }
    } catch (error) {
      // Ignore
    }

    return {
      type: 'audio',
      text: transcribedText,
      metadata: file.metadata as any,
    }
  } catch (error) {
    return {
      type: 'audio',
      error: error instanceof Error ? error.message : '解析失败',
    }
  }
}

/**
 * 音频标准化（转 wav/16kHz）
 */
async function normalizeAudio(audioPath: string): Promise<string> {
  try {
    const ffmpeg = await import('fluent-ffmpeg')
    const path = await import('path')

    const outputPath = path.join('/tmp', `normalized_${Date.now()}.wav`)

    await new Promise<void>((resolve, reject) => {
      ffmpeg.default(audioPath)
        .audioCodec('pcm_s16le')
        .audioFrequency(16000)
        .audioChannels(1)
        .format('wav')
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath)
    })

    return outputPath
  } catch (error: any) {
    console.warn('[Audio Parser] Normalization failed, using original:', error.message)
    return audioPath
  }
}

/**
 * 音频降噪
 */
async function denoiseAudio(audioPath: string): Promise<string | null> {
  try {
    const ffmpeg = await import('fluent-ffmpeg')
    const path = await import('path')

    const outputPath = path.join('/tmp', `denoised_${Date.now()}.wav`)

    // 使用 FFmpeg 的降噪滤镜
    await new Promise<void>((resolve, reject) => {
      ffmpeg.default(audioPath)
        .audioFilters(['highpass=f=200', 'lowpass=f=3000', 'anlmdn'])
        .audioCodec('pcm_s16le')
        .audioFrequency(16000)
        .format('wav')
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath)
    })

    return outputPath
  } catch (error: any) {
    console.warn('[Audio Parser] Denoising failed:', error.message)
    return null
  }
}

/**
 * 使用 Whisper 转文本
 */
async function transcribeAudioWithWhisper(audioPath: string): Promise<string> {
  try {
    // 使用 OpenAI Whisper API
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured')
    }

    const FormData = await import('form-data')
    const fs = await import('fs')
    const formData = new FormData.default()
    formData.append('file', fs.createReadStream(audioPath))
    formData.append('model', 'whisper-1')
    formData.append('language', 'zh') // 中文

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: formData as any,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(`Whisper API failed: ${error.error?.message || response.status}`)
    }

    const data = await response.json()
    return data.text || ''
  } catch (error: any) {
    console.error('[Audio Parser] Whisper transcription failed:', error)
    throw new Error(`音频转文本失败: ${error.message}`)
  }
}

/**
 * 解析代码文件
 */
export async function parseCode(fileId: string): Promise<ParseResult> {
  try {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: { metadata: true },
    })

    if (!file) {
      throw new Error('文件不存在')
    }

    // 代码解析包括：
    // 1. 识别编程语言
    // 2. 提取代码结构
    // 3. 提取依赖关系
    
    const fs = await import('fs/promises')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'storage', file.storagePath)
    const code = await fs.readFile(filePath, 'utf-8')
    
    // 识别编程语言（简单实现）
    const ext = path.extname(file.originalFilename).toLowerCase()
    const languageMap: Record<string, string> = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.go': 'go',
      '.rs': 'rust',
      '.php': 'php',
      '.rb': 'ruby',
    }
    
    const language = languageMap[ext] || 'unknown'
    const linesOfCode = code.split('\n').filter(line => line.trim().length > 0).length
    
    return {
      type: 'code',
      text: code,
      metadata: {
        code: {
          programmingLanguage: language,
          linesOfCode,
        },
      },
    }
  } catch (error) {
    return {
      type: 'code',
      error: error instanceof Error ? error.message : '解析失败',
    }
  }
}

/**
 * 多文件解析（复合任务）
 */
export async function parseMultipleFiles(fileIds: string[]): Promise<ParseResult[]> {
  const results: ParseResult[] = []
  
  for (const fileId of fileIds) {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    })
    
    if (!file) {
      results.push({
        type: 'document',
        error: `文件 ${fileId} 不存在`,
      })
      continue
    }
    
    // 根据文件类型选择解析方法
    switch (file.fileType) {
      case 'document':
        results.push(await parseDocument(fileId))
        break
      case 'image':
        results.push(await parseImage(fileId))
        break
      case 'video':
        results.push(await parseVideo(fileId))
        break
      case 'audio':
        results.push(await parseAudio(fileId))
        break
      case 'code':
        results.push(await parseCode(fileId))
        break
      default:
        results.push({
          type: 'document',
          error: `不支持的文件类型: ${file.fileType}`,
        })
    }
  }
  
  return results
}

