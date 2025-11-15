/**
 * 文档解析API
 * POST /api/parse/document
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { parseDocument } from '@/lib/multimodal-parser'
import type { ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request)
    if (!token) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '未提供认证令牌',
      }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '认证令牌无效或已过期',
      }, { status: 401 })
    }

    const body = await request.json()
    const { fileId } = body

    if (!fileId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '缺少fileId参数',
      }, { status: 400 })
    }

    const result = await parseDocument(fileId)

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('[Parse Document API] Error:', error)
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

