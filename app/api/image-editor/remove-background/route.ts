/**
 * 背景移除API
 * POST /api/image-editor/remove-background
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { removeBackground } from '@/lib/image-editor-utils'
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
    const { imageUrl } = body

    if (!imageUrl) {
      return NextResponse.json({ success: false, error: '缺少图像URL' }, { status: 400 })
    }

    const apiKey = process.env.REMOVE_BG_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: '背景移除API未配置' },
        { status: 500 }
      )
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
    fs.writeFileSync(inputPath, imageBuffer)

    // 移除背景
    const resultBuffer = await removeBackground(inputPath, apiKey)

    // 清理临时文件
    fs.unlinkSync(inputPath)

    // 返回base64编码的结果
    const base64 = resultBuffer.toString('base64')
    const dataUrl = `data:image/png;base64,${base64}`

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: dataUrl,
      },
    })
  } catch (error) {
    console.error('[Remove Background] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

