/**
 * 图像格式转换API（支持WebP转其他格式）
 * POST /api/image-editor/convert
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { compressImage } from '@/lib/image-editor-utils'
import * as fs from 'fs'
import * as path from 'path'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request)
    if (!token) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: '令牌无效' }, { status: 401 })
    }

    const body = await request.json()
    const { imageUrl, targetFormat = 'jpeg', quality = 90 } = body

    if (!imageUrl) {
      return NextResponse.json({ success: false, error: '缺少图像URL' }, { status: 400 })
    }

    const validFormats = ['jpeg', 'png', 'webp', 'gif']
    if (!validFormats.includes(targetFormat)) {
      return NextResponse.json(
        { success: false, error: `不支持的格式: ${targetFormat}` },
        { status: 400 }
      )
    }

    // 下载图像
    const response = await fetch(imageUrl)
    const imageBuffer = Buffer.from(await response.arrayBuffer())

    // 保存临时文件（使用唯一文件名避免并发冲突）
    const tempDir = path.join(process.cwd(), 'temp', decoded.id)
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 9)
    const inputPath = path.join(tempDir, `input_${timestamp}_${randomId}.jpg`)
    const outputPath = path.join(tempDir, `output_${timestamp}_${randomId}.${targetFormat}`)

    fs.writeFileSync(inputPath, imageBuffer)

    // 转换格式
    await compressImage(inputPath, outputPath, {
      quality,
      format: targetFormat as 'jpeg' | 'png' | 'webp',
    })

    // 读取结果
    const resultBuffer = fs.readFileSync(outputPath)

    // 清理临时文件
    fs.unlinkSync(inputPath)
    fs.unlinkSync(outputPath)

    // 返回base64编码的结果
    const mimeTypes: Record<string, string> = {
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
    }
    const mimeType = mimeTypes[targetFormat] || 'image/jpeg'
    const base64 = resultBuffer.toString('base64')
    const dataUrl = `data:${mimeType};base64,${base64}`

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: dataUrl,
        format: targetFormat,
        originalSize: imageBuffer.length,
        convertedSize: resultBuffer.length,
        compressionRatio: ((1 - resultBuffer.length / imageBuffer.length) * 100).toFixed(2),
      },
    })
  } catch (error) {
    console.error('[Image Convert] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

