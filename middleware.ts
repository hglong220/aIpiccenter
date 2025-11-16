import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimitMiddleware } from '@/lib/rate-limiter'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { logError } from '@/lib/error-logger'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 跳过静态资源和API健康检查
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next()
  }

  // API路由限流
  if (pathname.startsWith('/api/')) {
    try {
      // 获取用户ID（如果已登录）
      const token = getTokenFromCookies(request)
      let userId: string | undefined
      
      if (token) {
        const decoded = verifyToken(token)
        userId = decoded?.id
      }

      // 应用限流
      const rateLimitResult = rateLimitMiddleware(
        request,
        userId,
        { windowMs: 60000, maxRequests: 100 }, // IP限流：每分钟100次
        { windowMs: 60000, maxRequests: 200 }  // 用户限流：每分钟200次
      )

      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: rateLimitResult.error || '请求过于频繁',
            retryAfter: rateLimitResult.retryAfter,
          },
          {
            status: 429,
            headers: {
              'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
            },
          }
        )
      }
    } catch (error) {
      // 限流检查失败，记录错误但允许请求继续
      await logError(
        '限流中间件错误',
        error instanceof Error ? error : String(error),
        { pathname }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
