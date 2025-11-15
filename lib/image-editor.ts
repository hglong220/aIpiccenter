/**
 * 图像编辑工具
 * 使用Sharp进行图像处理
 */

import type { FileMetadata } from '@/types'

export interface ImageEditOptions {
  crop?: {
    x: number
    y: number
    width: number
    height: number
  }
  resize?: {
    width?: number
    height?: number
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
  }
  format?: 'jpeg' | 'png' | 'webp' | 'gif'
  quality?: number // 1-100
  denoise?: boolean
  removeBackground?: boolean
  enhance?: boolean
}

export interface ImageEditResult {
  buffer: Buffer
  format: string
  width: number
  height: number
  size: number
}

/**
 * 编辑图像
 */
export async function editImage(
  inputBuffer: Buffer,
  options: ImageEditOptions
): Promise<ImageEditResult> {
  try {
    // 动态导入sharp
    const sharp = await import('sharp').catch(() => {
      throw new Error('sharp未安装，请运行: npm install sharp')
    })

    let pipeline = sharp.default(inputBuffer)

    // 裁剪
    if (options.crop) {
      pipeline = pipeline.extract({
        left: options.crop.x,
        top: options.crop.y,
        width: options.crop.width,
        height: options.crop.height,
      })
    }

    // 调整尺寸
    if (options.resize) {
      pipeline = pipeline.resize({
        width: options.resize.width,
        height: options.resize.height,
        fit: options.resize.fit || 'cover',
      })
    }

    // 降噪（使用sharpen滤镜）
    if (options.denoise) {
      pipeline = pipeline.sharpen({
        sigma: 1,
        flat: 1,
        jagged: 2,
      })
    }

    // 增强（调整对比度和饱和度）
    if (options.enhance) {
      pipeline = pipeline.modulate({
        brightness: 1.1,
        saturation: 1.2,
        hue: 0,
      }).normalise()
    }

    // 格式转换
    const format = options.format || 'jpeg'
    const quality = options.quality || 90

    switch (format) {
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality })
        break
      case 'png':
        pipeline = pipeline.png({ quality })
        break
      case 'webp':
        pipeline = pipeline.webp({ quality })
        break
      case 'gif':
        pipeline = pipeline.gif()
        break
    }

    // 背景移除（需要额外的库支持，这里提供框架）
    if (options.removeBackground) {
      // TODO: 集成背景移除服务（如remove.bg API）
      console.warn('背景移除功能需要集成remove.bg等API服务')
    }

    // 处理图像
    const outputBuffer = await pipeline.toBuffer()
    const metadata = await sharp.default(outputBuffer).metadata()

    return {
      buffer: outputBuffer,
      format: format,
      width: metadata.width || 0,
      height: metadata.height || 0,
      size: outputBuffer.length,
    }
  } catch (error) {
    throw new Error(`图像编辑失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * 裁剪图像
 */
export async function cropImage(
  inputBuffer: Buffer,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<ImageEditResult> {
  return editImage(inputBuffer, {
    crop: { x, y, width, height },
  })
}

/**
 * 调整图像尺寸
 */
export async function resizeImage(
  inputBuffer: Buffer,
  width?: number,
  height?: number,
  fit: 'cover' | 'contain' | 'fill' | 'inside' | 'outside' = 'cover'
): Promise<ImageEditResult> {
  return editImage(inputBuffer, {
    resize: { width, height, fit },
  })
}

/**
 * 转换图像格式
 */
export async function convertImageFormat(
  inputBuffer: Buffer,
  format: 'jpeg' | 'png' | 'webp' | 'gif',
  quality: number = 90
): Promise<ImageEditResult> {
  return editImage(inputBuffer, {
    format,
    quality,
  })
}

/**
 * 图像降噪
 */
export async function denoiseImage(inputBuffer: Buffer): Promise<ImageEditResult> {
  return editImage(inputBuffer, {
    denoise: true,
  })
}

/**
 * 图像增强
 */
export async function enhanceImage(inputBuffer: Buffer): Promise<ImageEditResult> {
  return editImage(inputBuffer, {
    enhance: true,
  })
}

/**
 * 生成缩略图
 */
export async function generateThumbnail(
  inputBuffer: Buffer,
  width: number = 200,
  height: number = 200
): Promise<ImageEditResult> {
  return editImage(inputBuffer, {
    resize: {
      width,
      height,
      fit: 'cover',
    },
    format: 'jpeg',
    quality: 80,
  })
}

