/**
 * 图像编辑工具函数
 * 裁剪、压缩、分辨率调整、WebP转换、背景移除、一键增强
 */

import sharp from 'sharp'
import * as fs from 'fs'
import * as path from 'path'

export interface CropOptions {
  x: number
  y: number
  width: number
  height: number
}

export interface ResizeOptions {
  width?: number
  height?: number
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
}

export interface CompressOptions {
  quality: number // 1-100
  format?: 'jpeg' | 'png' | 'webp'
}

/**
 * 裁剪图像
 */
export async function cropImage(
  inputPath: string,
  outputPath: string,
  options: CropOptions
): Promise<string> {
  try {
    await sharp(inputPath)
      .extract({
        left: options.x,
        top: options.y,
        width: options.width,
        height: options.height,
      })
      .toFile(outputPath)

    return outputPath
  } catch (error: any) {
    throw new Error(`图像裁剪失败: ${error.message}`)
  }
}

/**
 * 调整图像分辨率
 */
export async function resizeImage(
  inputPath: string,
  outputPath: string,
  options: ResizeOptions
): Promise<string> {
  try {
    const sharpInstance = sharp(inputPath)

    if (options.width && options.height) {
      await sharpInstance
        .resize(options.width, options.height, {
          fit: options.fit || 'cover',
        })
        .toFile(outputPath)
    } else if (options.width) {
      await sharpInstance.resize(options.width, null).toFile(outputPath)
    } else if (options.height) {
      await sharpInstance.resize(null, options.height).toFile(outputPath)
    } else {
      throw new Error('必须指定宽度或高度')
    }

    return outputPath
  } catch (error: any) {
    throw new Error(`图像缩放失败: ${error.message}`)
  }
}

/**
 * 压缩图像
 */
export async function compressImage(
  inputPath: string,
  outputPath: string,
  options: CompressOptions
): Promise<string> {
  try {
    const format = options.format || 'jpeg'
    const quality = Math.max(1, Math.min(100, options.quality))

    if (format === 'webp') {
      await sharp(inputPath).webp({ quality }).toFile(outputPath)
    } else if (format === 'png') {
      await sharp(inputPath)
        .png({ quality, compressionLevel: 9 })
        .toFile(outputPath)
    } else {
      await sharp(inputPath).jpeg({ quality, mozjpeg: true }).toFile(outputPath)
    }

    return outputPath
  } catch (error: any) {
    throw new Error(`图像压缩失败: ${error.message}`)
  }
}

/**
 * 转换为WebP格式
 */
export async function convertToWebP(
  inputPath: string,
  outputPath: string,
  quality: number = 80
): Promise<string> {
  try {
    await sharp(inputPath).webp({ quality }).toFile(outputPath)
    return outputPath
  } catch (error: any) {
    throw new Error(`WebP转换失败: ${error.message}`)
  }
}

/**
 * 背景移除（使用API）
 * 支持：Remove.bg API
 */
export async function removeBackground(
  imagePath: string,
  apiKey: string
): Promise<Buffer> {
  try {
    const FormData = await import('form-data')
    const fs = await import('fs')

    const formData = new FormData.default()
    formData.append('image_file', fs.createReadStream(imagePath))

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
      },
      body: formData as any,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`背景移除API失败: ${error}`)
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    return buffer
  } catch (error: any) {
    throw new Error(`背景移除失败: ${error.message}`)
  }
}

/**
 * 一键增强（自动优化）
 */
export async function enhanceImage(
  inputPath: string,
  outputPath: string
): Promise<string> {
  try {
    await sharp(inputPath)
      .normalize() // 标准化亮度
      .sharpen() // 锐化
      .modulate({
        brightness: 1.1, // 稍微提亮
        saturation: 1.1, // 稍微增加饱和度
      })
      .toFile(outputPath)

    return outputPath
  } catch (error: any) {
    throw new Error(`图像增强失败: ${error.message}`)
  }
}

/**
 * 批量处理图像
 */
export async function batchProcessImages(
  inputPaths: string[],
  outputDir: string,
  processor: (input: string, output: string) => Promise<string>
): Promise<string[]> {
  const results: string[] = []

  for (const inputPath of inputPaths) {
    const filename = path.basename(inputPath)
    const outputPath = path.join(outputDir, filename)
    const result = await processor(inputPath, outputPath)
    results.push(result)
  }

  return results
}

