import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/generate/:path*', 
    '/image-editor/:path*', 
    '/history/:path*', 
    '/projects/:path*', 
    '/payment/:path*',
    '/chat/:path*', // 添加 chat 路径
    '/search',     // 添加 search 路径
    '/'            // 在首页也执行以确保初始化
  ],
}