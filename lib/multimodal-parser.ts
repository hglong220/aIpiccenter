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
      await prisma.fileMetadata.update({
        where: { id: file.metadata.id },
        data: {
          extractedText: result.text,
          wordCount: result.text.split(/\s+/).length,
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
    const pdfParse = await import('pdf-parse').catch(() => null)
    
    if (!pdfParse) {
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
    // 需要安装 Tesseract OCR
    // 这里提供框架，实际需要配置Tesseract
    console.warn('PDF OCR功能需要配置Tesseract OCR')
    
    // TODO: 实现OCR逻辑
    // 1. 将PDF转换为图像
    // 2. 对每页进行OCR
    // 3. 合并文本结果
    
    return {
      type: 'document',
      text: '[OCR功能待实现]',
      error: 'OCR功能需要配置Tesseract OCR',
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
    const mammoth = await import('mammoth').catch(() => null)
    
    if (!mammoth) {
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
    // PowerPoint解析比较复杂，需要提取每页的文本
    // 可以使用 officegen 或类似的库
    console.warn('PowerPoint解析功能待实现')
    
    // TODO: 实现PPT解析
    // 1. 提取每页文本
    // 2. 提取图片（可选）
    // 3. 返回结构化数据
    
    return {
      type: 'document',
      text: '[PPT解析功能待实现]',
      error: 'PPT解析功能需要安装officegen等库',
    }
  } catch (error) {
    throw new Error(`PPT解析失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * 解析Excel
 */
async function parseExcel(file: any): Promise<ParseResult> {
  try {
    // 需要安装 xlsx: npm install xlsx
    const XLSX = await import('xlsx').catch(() => null)
    
    if (!XLSX) {
      throw new Error('xlsx未安装，请运行: npm install xlsx')
    }

    const fs = await import('fs/promises')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'storage', file.storagePath)
    const fileBuffer = await fs.readFile(filePath)

    const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
    
    // 转换为JSON
    const sheets: Record<string, any[]> = {}
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName]
      sheets[sheetName] = XLSX.utils.sheet_to_json(sheet)
    })
    
    return {
      type: 'document',
      extractedData: sheets,
      metadata: {
        document: {
          pageCount: workbook.SheetNames.length,
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
 * 解析视频
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

    // 视频解析包括：
    // 1. 提取关键帧
    // 2. 提取音频
    // 3. 分析视频内容
    
    // TODO: 实现视频解析逻辑
    // 需要FFmpeg支持
    
    return {
      type: 'video',
      metadata: file.metadata as any,
    }
  } catch (error) {
    return {
      type: 'video',
      error: error instanceof Error ? error.message : '解析失败',
    }
  }
}

/**
 * 解析音频
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

    // 音频解析包括：
    // 1. 转码到标准格式（wav/16kHz）
    // 2. 使用Whisper转文本
    // 3. 噪音过滤
    
    // TODO: 实现音频解析逻辑
    // 需要FFmpeg和Whisper支持
    
    return {
      type: 'audio',
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

