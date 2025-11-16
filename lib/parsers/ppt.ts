/**
 * PowerPoint 解析
 * 提取 PPT 中的文本和图片
 */

import * as fs from 'fs'
import * as path from 'path'
import * as archiver from 'archiver'
import * as xml2js from 'xml2js'

export interface PPTParseResult {
  slides: Array<{
    slideNumber: number
    text: string
    images: string[]
  }>
  totalSlides: number
}

/**
 * 解析 PowerPoint 文件
 */
export async function parsePPT(filePath: string): Promise<PPTParseResult> {
  try {
    // PPTX 文件实际上是 ZIP 压缩包
    // 需要解压并解析 XML 文件

    const tempDir = path.join('/tmp', `ppt_extract_${Date.now()}`)
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    // 解压 PPTX
    const AdmZip = await import('adm-zip').catch(() => null)
    if (!AdmZip) {
      throw new Error('adm-zip未安装，请运行: npm install adm-zip')
    }

    const zip = new AdmZip.default(filePath)
    zip.extractAllTo(tempDir, true)

    // 读取幻灯片列表
    const slidesDir = path.join(tempDir, 'ppt', 'slides')
    const slideFiles = fs.readdirSync(slidesDir)
      .filter(f => f.startsWith('slide') && f.endsWith('.xml'))
      .sort()

    const slides: Array<{ slideNumber: number; text: string; images: string[] }> = []

    for (let i = 0; i < slideFiles.length; i++) {
      const slideFile = slideFiles[i]
      const slidePath = path.join(slidesDir, slideFile)
      const slideXml = fs.readFileSync(slidePath, 'utf-8')

      // 解析 XML
      const parser = new xml2js.Parser()
      const slideData = await parser.parseStringPromise(slideXml)

      // 提取文本
      const textElements: string[] = []
      extractTextFromXML(slideData, textElements)

      // 提取图片引用
      const images: string[] = []
      extractImagesFromXML(slideData, images)

      slides.push({
        slideNumber: i + 1,
        text: textElements.join('\n'),
        images,
      })
    }

    // 清理临时目录
    try {
      fs.rmSync(tempDir, { recursive: true, force: true })
    } catch (error) {
      // Ignore
    }

    return {
      slides,
      totalSlides: slides.length,
    }
  } catch (error: any) {
    console.error('[PPT Parser] Error:', error)
    throw new Error(`PPT解析失败: ${error.message}`)
  }
}

/**
 * 从 XML 中提取文本
 */
function extractTextFromXML(obj: any, texts: string[]): void {
  if (typeof obj === 'string') {
    if (obj.trim()) {
      texts.push(obj.trim())
    }
  } else if (Array.isArray(obj)) {
    obj.forEach(item => extractTextFromXML(item, texts))
  } else if (obj && typeof obj === 'object') {
    Object.values(obj).forEach(value => extractTextFromXML(value, texts))
  }
}

/**
 * 从 XML 中提取图片
 */
function extractImagesFromXML(obj: any, images: string[]): void {
  if (obj && typeof obj === 'object') {
    // 查找图片关系引用
    if (obj['a:blip'] && obj['a:blip'][0] && obj['a:blip'][0]['$'] && obj['a:blip'][0]['$']['r:embed']) {
      const imageId = obj['a:blip'][0]['$']['r:embed']
      images.push(imageId)
    }

    Object.values(obj).forEach(value => extractImagesFromXML(value, images))
  }
}

