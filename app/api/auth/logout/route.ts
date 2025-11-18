/**
 * API Route: Logout
 *
 * POST /api/auth/logout
 */

import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth'
import type { ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  const response = NextResponse.json<ApiResponse<null>>({
    success: true,
    message: '已退出登录',
  })

  clearAuthCookie(response)

  return response
}

















































