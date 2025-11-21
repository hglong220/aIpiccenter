/**
 * 图像WebP转换API
 * POST /api/image-editor/webp
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { convertToWebP } from '@/lib/image-editor-utils'
import * as fs from 'fs'
import * as path from 'path'

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
    const { imageUrl, quality = 80 } = body

    if (!imageUrl) {
      return NextResponse.json({ success: false, error: '缺少图像URL' }, { status: 400 })
    }

    // 下载图像
    const response = await fetch(imageUrl)
    const imageBuffer = Buffer.from(await response.arrayBuffer())

    // 保存临时文件
    const tempDir = path.join(process.cwd(), 'temp', decoded.id)
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const inputPath = path.join(tempDir, `input_${Date.now()}.jpg`)
    const outputPath = path.join(tempDir, `output_${Date.now()}.webp`)

    fs.writeFileSync(inputPath, imageBuffer)

    // 转换为WebP
    await convertToWebP(inputPath, outputPath, quality)

    // 读取结果
    const resultBuffer = fs.readFileSync(outputPath)

    // 清理临时文件
    fs.unlinkSync(inputPath)
    fs.unlinkSync(outputPath)

    // 返回base64编码的结果
    const base64 = resultBuffer.toString('base64')
    const dataUrl = `data:image/webp;base64,${base64}`

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: dataUrl,
        originalSize: imageBuffer.length,
        webpSize: resultBuffer.length,
        compressionRatio: ((1 - resultBuffer.length / imageBuffer.length) * 100).toFixed(2),
      },
    })
  } catch (error) {
    console.error('[Image WebP] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

