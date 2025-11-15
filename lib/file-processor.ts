/**
 * 文件预处理服务
 * 负责文件转码、压缩、格式转换等
 */

import { readFile } from 'fs/promises'
import { join } from 'path'
import { writeFile } from 'fs/promises'
import { existsSync } from 'fs'

export interface ProcessOptions {
  // 图像处理选项
  imageMaxWidth?: number
  imageMaxHeight?: number
  imageQuality?: number // 0-100
  imageFormat?: 'jpeg' | 'png' | 'webp'
  
  // 视频处理选项
  videoCodec?: 'h264' | 'h265'
  videoBitrate?: string // 如 "2M"
  videoMaxWidth?: number
  videoMaxHeight?: number
  videoFps?: number
  
  // 音频处理选项
  audioFormat?: 'wav' | 'mp3' | 'ogg'
  audioSampleRate?: number // 16000, 44100, 48000
  audioBitrate?: string // 如 "128k"
  audioChannels?: number // 1 (mono) or 2 (stereo)
  
  // PDF处理选项
  pdfExtractText?: boolean
  pdfGenerateImages?: boolean
  pdfImageFormat?: 'png' | 'jpeg'
}

export interface ProcessResult {
  processed: boolean
  outputPath?: string
  outputSize?: number
  originalSize: number
  compressionRatio?: number
}

/**
 * 图像处理（需要sharp库）
 */
export async function processImage(
  inputPath: string,
  outputPath: string,
  options: ProcessOptions = {}
): Promise<ProcessResult> {
  try {
    // 动态导入sharp（如果可用）
    const sharp = await import('sharp').catch(() => null)
    
    if (!sharp) {
      console.warn('sharp not installed. Skipping image processing.')
      return {
        processed: false,
        originalSize: 0,
      }
    }
    
    const {
      imageMaxWidth = 4096,
      imageMaxHeight = 4096,
      imageQuality = 85,
      imageFormat = 'jpeg',
    } = options
    
    const image = sharp.default(inputPath)
    const metadata = await image.metadata()
    const originalSize = metadata.size || 0
    
    // 检查是否需要压缩
    const needsResize = metadata.width && metadata.height &&
      (metadata.width > imageMaxWidth || metadata.height > imageMaxHeight)
    
    let processed = image
    
    if (needsResize) {
      processed = processed.resize(imageMaxWidth, imageMaxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
    }
    
    // 转换格式和质量
    if (imageFormat === 'jpeg') {
      processed = processed.jpeg({ quality: imageQuality })
    } else if (imageFormat === 'png') {
      processed = processed.png({ quality: imageQuality })
    } else if (imageFormat === 'webp') {
      processed = processed.webp({ quality: imageQuality })
    }
    
    await processed.toFile(outputPath)
    
    const outputStats = await import('fs').then(fs => fs.promises.stat(outputPath))
    const outputSize = outputStats.size
    const compressionRatio = originalSize > 0 ? (1 - outputSize / originalSize) * 100 : 0
    
    return {
      processed: true,
      outputPath,
      outputSize,
      originalSize,
      compressionRatio,
    }
  } catch (error) {
    console.error('Error processing image:', error)
    return {
      processed: false,
      originalSize: 0,
    }
  }
}

/**
 * 视频处理（需要ffmpeg）
 */
export async function processVideo(
  inputPath: string,
  outputPath: string,
  options: ProcessOptions = {}
): Promise<ProcessResult> {
  try {
    // 动态导入fluent-ffmpeg（如果可用）
    const ffmpeg = await import('fluent-ffmpeg').catch(() => null)
    
    if (!ffmpeg) {
      console.warn('fluent-ffmpeg not installed. Skipping video processing.')
      return {
        processed: false,
        originalSize: 0,
      }
    }
    
    const {
      videoCodec = 'h264',
      videoBitrate = '2M',
      videoMaxWidth = 1920,
      videoMaxHeight = 1080,
      videoFps = 30,
    } = options
    
    const inputStats = await import('fs').then(fs => fs.promises.stat(inputPath))
    const originalSize = inputStats.size
    
    return new Promise((resolve, reject) => {
      ffmpeg.default(inputPath)
        .videoCodec(videoCodec === 'h264' ? 'libx264' : 'libx265')
        .videoBitrate(videoBitrate)
        .size(`${videoMaxWidth}x${videoMaxHeight}`)
        .fps(videoFps)
        .on('end', async () => {
          try {
            const outputStats = await import('fs').then(fs => fs.promises.stat(outputPath))
            const outputSize = outputStats.size
            const compressionRatio = originalSize > 0 ? (1 - outputSize / originalSize) * 100 : 0
            
            resolve({
              processed: true,
              outputPath,
              outputSize,
              originalSize,
              compressionRatio,
            })
          } catch (error) {
            reject(error)
          }
        })
        .on('error', (error: Error) => {
          reject(error)
        })
        .save(outputPath)
    })
  } catch (error) {
    console.error('Error processing video:', error)
    return {
      processed: false,
      originalSize: 0,
    }
  }
}

/**
 * 音频处理（需要ffmpeg）
 */
export async function processAudio(
  inputPath: string,
  outputPath: string,
  options: ProcessOptions = {}
): Promise<ProcessResult> {
  try {
    const ffmpeg = await import('fluent-ffmpeg').catch(() => null)
    
    if (!ffmpeg) {
      console.warn('fluent-ffmpeg not installed. Skipping audio processing.')
      return {
        processed: false,
        originalSize: 0,
      }
    }
    
    const {
      audioFormat = 'wav',
      audioSampleRate = 44100,
      audioBitrate = '128k',
      audioChannels = 2,
    } = options
    
    const inputStats = await import('fs').then(fs => fs.promises.stat(inputPath))
    const originalSize = inputStats.size
    
    return new Promise((resolve, reject) => {
      let command = ffmpeg.default(inputPath)
        .audioFrequency(audioSampleRate)
        .audioChannels(audioChannels)
        .audioBitrate(audioBitrate)
      
      if (audioFormat === 'mp3') {
        command = command.audioCodec('libmp3lame')
      } else if (audioFormat === 'ogg') {
        command = command.audioCodec('libvorbis')
      }
      
      command
        .on('end', async () => {
          try {
            const outputStats = await import('fs').then(fs => fs.promises.stat(outputPath))
            const outputSize = outputStats.size
            const compressionRatio = originalSize > 0 ? (1 - outputSize / originalSize) * 100 : 0
            
            resolve({
              processed: true,
              outputPath,
              outputSize,
              originalSize,
              compressionRatio,
            })
          } catch (error) {
            reject(error)
          }
        })
        .on('error', (error: Error) => {
          reject(error)
        })
        .save(outputPath)
    })
  } catch (error) {
    console.error('Error processing audio:', error)
    return {
      processed: false,
      originalSize: 0,
    }
  }
}

/**
 * PDF文本提取（需要pdf-parse）
 */
export async function extractPDFText(pdfPath: string): Promise<string> {
  try {
    const pdfParse = await import('pdf-parse').catch(() => null)
    
    if (!pdfParse) {
      console.warn('pdf-parse not installed. Skipping PDF text extraction.')
      return ''
    }
    
    const dataBuffer = await readFile(pdfPath)
    const data = await pdfParse.default(dataBuffer)
    return data.text || ''
  } catch (error) {
    console.error('Error extracting PDF text:', error)
    return ''
  }
}

/**
 * PDF转图像（需要pdf-poppler或pdf2pic）
 */
export async function convertPDFToImages(
  pdfPath: string,
  outputDir: string,
  options: ProcessOptions = {}
): Promise<string[]> {
  try {
    // 这里可以使用pdf-poppler或pdf2pic
    // 由于依赖较复杂，先返回空数组
    console.warn('PDF to image conversion not implemented. Install pdf-poppler or pdf2pic.')
    return []
  } catch (error) {
    console.error('Error converting PDF to images:', error)
    return []
  }
}

/**
 * 根据文件类型自动处理
 */
export async function autoProcessFile(
  inputPath: string,
  outputPath: string,
  fileType: string,
  options: ProcessOptions = {}
): Promise<ProcessResult> {
  switch (fileType) {
    case 'image':
      return processImage(inputPath, outputPath, options)
    case 'video':
      return processVideo(inputPath, outputPath, options)
    case 'audio':
      return processAudio(inputPath, outputPath, options)
    default:
      return {
        processed: false,
        originalSize: 0,
      }
  }
}

