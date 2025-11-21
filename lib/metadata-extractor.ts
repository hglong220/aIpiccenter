/**
 * 文件元数据提取服务
 * 提取图像、视频、音频、文档、代码等的元数据
 */

import { readFile } from 'fs/promises'
import { stat } from 'fs/promises'

export interface ImageMetadata {
  width?: number
  height?: number
  aspectRatio?: string
  colorMode?: string
  format?: string
  hasAlpha?: boolean
  colorSpace?: string
  orientation?: number
}

export interface VideoMetadata {
  width?: number
  height?: number
  duration?: number
  bitrate?: number
  codec?: string
  fps?: number
  audioCodec?: string
  audioBitrate?: number
  audioChannels?: number
  audioSampleRate?: number
}

export interface AudioMetadata {
  duration?: number
  bitrate?: number
  sampleRate?: number
  channels?: number
  format?: string
  codec?: string
}

export interface DocumentMetadata {
  pageCount?: number
  wordCount?: number
  language?: string
  extractedText?: string
  author?: string
  title?: string
  subject?: string
}

export interface CodeMetadata {
  programmingLanguage?: string
  linesOfCode?: number
  fileStructure?: any
  dependencies?: string[]
}

export interface FileMetadata {
  size: number
  mimeType: string
  fileType: string
  image?: ImageMetadata
  video?: VideoMetadata
  audio?: AudioMetadata
  document?: DocumentMetadata
  code?: CodeMetadata
  extra?: Record<string, any>
}

/**
 * 提取图像元数据（使用sharp）
 */
export async function extractImageMetadata(filePath: string): Promise<ImageMetadata> {
  try {
    const sharp = await import('sharp').catch(() => null)
    
    if (!sharp) {
      return {}
    }
    
    const image = sharp.default(filePath)
    const metadata = await image.metadata()
    
    const width = metadata.width
    const height = metadata.height
    
    let aspectRatio: string | undefined
    if (width && height) {
      const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
      const divisor = gcd(width, height)
      aspectRatio = `${width / divisor}:${height / divisor}`
    }
    
    return {
      width,
      height,
      aspectRatio,
      colorMode: metadata.hasAlpha ? 'RGBA' : 'RGB',
      format: metadata.format,
      hasAlpha: metadata.hasAlpha,
      colorSpace: metadata.space,
      orientation: metadata.orientation,
    }
  } catch (error) {
    console.error('Error extracting image metadata:', error)
    return {}
  }
}

/**
 * 提取视频元数据（使用ffprobe）
 */
export async function extractVideoMetadata(filePath: string): Promise<VideoMetadata> {
  try {
    const ffmpeg = await import('fluent-ffmpeg').catch(() => null)
    
    if (!ffmpeg) {
      return {}
    }
    
    return new Promise((resolve) => {
      ffmpeg.default.ffprobe(filePath, (err, metadata) => {
        if (err) {
          console.error('Error extracting video metadata:', err)
          resolve({})
          return
        }
        
        const videoStream = metadata.streams?.find((s: any) => s.codec_type === 'video')
        const audioStream = metadata.streams?.find((s: any) => s.codec_type === 'audio')
        
        const duration = metadata.format?.duration ? parseFloat(metadata.format.duration) : undefined
        const bitrate = metadata.format?.bit_rate ? parseInt(metadata.format.bit_rate) : undefined
        
        resolve({
          width: videoStream?.width,
          height: videoStream?.height,
          duration,
          bitrate,
          codec: videoStream?.codec_name,
          fps: videoStream?.r_frame_rate ? eval(videoStream.r_frame_rate) : undefined,
          audioCodec: audioStream?.codec_name,
          audioBitrate: audioStream?.bit_rate ? parseInt(audioStream.bit_rate) : undefined,
          audioChannels: audioStream?.channels,
          audioSampleRate: audioStream?.sample_rate ? parseInt(audioStream.sample_rate) : undefined,
        })
      })
    })
  } catch (error) {
    console.error('Error extracting video metadata:', error)
    return {}
  }
}

/**
 * 提取音频元数据（使用ffprobe）
 */
export async function extractAudioMetadata(filePath: string): Promise<AudioMetadata> {
  try {
    const ffmpeg = await import('fluent-ffmpeg').catch(() => null)
    
    if (!ffmpeg) {
      return {}
    }
    
    return new Promise((resolve) => {
      ffmpeg.default.ffprobe(filePath, (err, metadata) => {
        if (err) {
          console.error('Error extracting audio metadata:', err)
          resolve({})
          return
        }
        
        const audioStream = metadata.streams?.find((s: any) => s.codec_type === 'audio')
        const duration = metadata.format?.duration ? parseFloat(metadata.format.duration) : undefined
        const bitrate = metadata.format?.bit_rate ? parseInt(metadata.format.bit_rate) : undefined
        
        resolve({
          duration,
          bitrate,
          sampleRate: audioStream?.sample_rate ? parseInt(audioStream.sample_rate) : undefined,
          channels: audioStream?.channels,
          format: metadata.format?.format_name,
          codec: audioStream?.codec_name,
        })
      })
    })
  } catch (error) {
    console.error('Error extracting audio metadata:', error)
    return {}
  }
}

/**
 * 提取PDF元数据（使用pdf-parse）
 */
export async function extractPDFMetadata(filePath: string): Promise<DocumentMetadata> {
  try {
    const pdfParse = await import('pdf-parse').catch(() => null)
    
    if (!pdfParse) {
      return {}
    }
    
    const dataBuffer = await readFile(filePath)
    const data = await pdfParse.default(dataBuffer)
    
    const text = data.text || ''
    const wordCount = text.split(/\s+/).filter((w: string) => w.length > 0).length
    
    // 简单的语言检测（可以集成更专业的库）
    const language = detectLanguage(text)
    
    return {
      pageCount: data.numpages,
      wordCount,
      language,
      extractedText: text.substring(0, 10000), // 限制提取文本长度
      author: data.info?.Author,
      title: data.info?.Title,
      subject: data.info?.Subject,
    }
  } catch (error) {
    console.error('Error extracting PDF metadata:', error)
    return {}
  }
}

/**
 * 提取代码元数据
 */
export async function extractCodeMetadata(filePath: string, language?: string): Promise<CodeMetadata> {
  try {
    const content = await readFile(filePath, 'utf-8')
    const lines = content.split('\n')
    const linesOfCode = lines.filter(line => line.trim().length > 0 && !line.trim().startsWith('//') && !line.trim().startsWith('#')).length
    
    // 检测编程语言（如果未提供）
    const detectedLanguage = language || detectProgrammingLanguage(filePath, content)
    
    // 提取依赖（简单实现）
    const dependencies = extractDependencies(content, detectedLanguage)
    
    return {
      programmingLanguage: detectedLanguage,
      linesOfCode,
      dependencies,
    }
  } catch (error) {
    console.error('Error extracting code metadata:', error)
    return {}
  }
}

/**
 * 检测编程语言
 */
function detectProgrammingLanguage(filename: string, content: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  
  const langMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    cs: 'csharp',
    go: 'go',
    rs: 'rust',
    php: 'php',
    rb: 'ruby',
    swift: 'swift',
    kt: 'kotlin',
    scala: 'scala',
    clj: 'clojure',
    hs: 'haskell',
    lua: 'lua',
    pl: 'perl',
    sh: 'shell',
    bash: 'bash',
  }
  
  return langMap[ext] || ext
}

/**
 * 提取依赖
 */
function extractDependencies(content: string, language: string): string[] {
  const dependencies: string[] = []
  
  if (language === 'javascript' || language === 'typescript') {
    // 提取 package.json 依赖
    const requireMatches = content.matchAll(/require\(['"]([^'"]+)['"]\)/g)
    const importMatches = content.matchAll(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g)
    
    for (const match of requireMatches) {
      if (!match[1].startsWith('.')) {
        dependencies.push(match[1])
      }
    }
    for (const match of importMatches) {
      if (!match[1].startsWith('.')) {
        dependencies.push(match[1])
      }
    }
  } else if (language === 'python') {
    // 提取 import 语句
    const importMatches = content.matchAll(/^import\s+(\w+)|^from\s+(\w+)\s+import/gm)
    for (const match of importMatches) {
      dependencies.push(match[1] || match[2])
    }
  }
  
  return [...new Set(dependencies)] // 去重
}

/**
 * 简单的语言检测
 */
function detectLanguage(text: string): string {
  // 简单的启发式检测
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const totalChars = text.length
  
  if (chineseChars / totalChars > 0.3) {
    return 'zh'
  }
  
  // 可以集成更专业的语言检测库
  return 'en'
}

/**
 * 提取文件元数据（统一入口）
 */
export async function extractFileMetadata(
  filePath: string,
  fileType: string,
  mimeType: string
): Promise<FileMetadata> {
  try {
    const fileStats = await stat(filePath)
    const size = fileStats.size
    
    const metadata: FileMetadata = {
      size,
      mimeType,
      fileType,
    }
    
    // 根据文件类型提取相应的元数据
    switch (fileType) {
      case 'image':
        try {
          metadata.image = await extractImageMetadata(filePath)
          if (metadata.image && Object.keys(metadata.image).length > 0) {
            console.log(`[Metadata] Image metadata extracted: ${filePath}`, {
              width: metadata.image.width,
              height: metadata.image.height,
              format: metadata.image.format,
            })
          }
        } catch (error) {
          console.error(`[Metadata] Failed to extract image metadata: ${filePath}`, error)
        }
        break
        
      case 'video':
        try {
          metadata.video = await extractVideoMetadata(filePath)
          if (metadata.video && Object.keys(metadata.video).length > 0) {
            console.log(`[Metadata] Video metadata extracted: ${filePath}`, {
              width: metadata.video.width,
              height: metadata.video.height,
              duration: metadata.video.duration,
              codec: metadata.video.codec,
            })
          }
        } catch (error) {
          console.error(`[Metadata] Failed to extract video metadata: ${filePath}`, error)
        }
        break
        
      case 'audio':
        try {
          metadata.audio = await extractAudioMetadata(filePath)
          if (metadata.audio && Object.keys(metadata.audio).length > 0) {
            console.log(`[Metadata] Audio metadata extracted: ${filePath}`, {
              duration: metadata.audio.duration,
              sampleRate: metadata.audio.sampleRate,
              channels: metadata.audio.channels,
            })
          }
        } catch (error) {
          console.error(`[Metadata] Failed to extract audio metadata: ${filePath}`, error)
        }
        break
        
      case 'document':
        try {
          if (mimeType === 'application/pdf') {
            metadata.document = await extractPDFMetadata(filePath)
            if (metadata.document && Object.keys(metadata.document).length > 0) {
              console.log(`[Metadata] PDF metadata extracted: ${filePath}`, {
                pageCount: metadata.document.pageCount,
                wordCount: metadata.document.wordCount,
              })
            }
          } else {
            // 其他文档类型可以在这里扩展
            console.log(`[Metadata] Document type ${mimeType} metadata extraction not implemented`)
          }
        } catch (error) {
          console.error(`[Metadata] Failed to extract document metadata: ${filePath}`, error)
        }
        break
        
      case 'code':
        try {
          metadata.code = await extractCodeMetadata(filePath)
          if (metadata.code && Object.keys(metadata.code).length > 0) {
            console.log(`[Metadata] Code metadata extracted: ${filePath}`, {
              language: metadata.code.programmingLanguage,
              linesOfCode: metadata.code.linesOfCode,
            })
          }
        } catch (error) {
          console.error(`[Metadata] Failed to extract code metadata: ${filePath}`, error)
        }
        break
        
      default:
        console.log(`[Metadata] File type ${fileType} metadata extraction not implemented`)
    }
    
    return metadata
  } catch (error) {
    console.error(`[Metadata] Error extracting file metadata: ${filePath}`, error)
    // 返回基础元数据
    try {
      const fileStats = await stat(filePath)
      return {
        size: fileStats.size,
        mimeType,
        fileType,
      }
    } catch (statError) {
      console.error(`[Metadata] Failed to get file stats: ${filePath}`, statError)
      return {
        size: 0,
        mimeType,
        fileType,
      }
    }
  }
}

