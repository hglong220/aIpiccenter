/**
 * API Route: File Upload
 * 
 * This endpoint handles file uploads for chat images and reference images.
 * 
 * POST /api/upload
 * Body: FormData with file
 * Response: ApiResponse<{ url: string, filename: string }>
 */

import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ApiResponse } from '@/types'

// 允许的文件类型（类似ChatGPT）
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'text/csv',
]
const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES]
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB (ChatGPT的限制)

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request)

    if (!token) {
      return NextResponse.json<ApiResponse<{ url: string; filename: string; mimeType: string; base64?: string }>>({
        success: false,
        error: '未提供认证令牌',
      }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json<ApiResponse<{ url: string; filename: string; mimeType: string; base64?: string }>>({
        success: false,
        error: '认证令牌无效或已过期',
      }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    })

    if (!user) {
      return NextResponse.json<ApiResponse<{ url: string; filename: string; mimeType: string; base64?: string }>>({
        success: false,
        error: '用户不存在',
      }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json<ApiResponse<{ url: string; filename: string; mimeType: string; base64?: string }>>({
        success: false,
        error: '未提供文件',
      }, { status: 400 })
    }

    // 验证文件类型
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json<ApiResponse<{ url: string; filename: string; mimeType: string; base64?: string }>>({
        success: false,
        error: `不支持的文件类型。支持的类型: 图片 (${ALLOWED_IMAGE_TYPES.join(', ')}) 或文档 (PDF, Word, Excel, CSV, TXT, Markdown)`,
      }, { status: 400 })
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json<ApiResponse<{ url: string; filename: string; mimeType: string; base64?: string }>>({
        success: false,
        error: `文件大小超过限制 (${MAX_FILE_SIZE / 1024 / 1024}MB)`,
      }, { status: 400 })
    }

    // 创建上传目录
    const uploadDir = join(process.cwd(), 'public', 'uploads', user.id)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // 生成唯一文件名
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop() || (ALLOWED_IMAGE_TYPES.includes(file.type) ? 'jpg' : 'bin')
    const filename = `${timestamp}-${randomStr}.${fileExtension}`
    const filepath = join(uploadDir, filename)

    // 保存文件
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // 返回文件URL和base64编码（用于直接发送给Gemini）
    const url = `/uploads/${user.id}/${filename}`
    
    // 对于图片文件，返回base64编码以便直接发送给Gemini API
    let base64: string | undefined
    if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
      base64 = buffer.toString('base64')
    }

    return NextResponse.json<ApiResponse<{ url: string; filename: string; mimeType: string; base64?: string }>>({
      success: true,
      data: {
        url,
        filename: file.name,
        mimeType: file.type,
        base64,
      },
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    const errorMessage = error instanceof Error ? error.message : '上传文件时发生未知错误'
    
    return NextResponse.json<ApiResponse<{ url: string; filename: string; mimeType: string; base64?: string }>>({
      success: false,
      error: errorMessage,
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json<ApiResponse<null>>({
    success: false,
    error: 'Method not allowed',
  }, { status: 405 })
}

