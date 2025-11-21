/**
 * Authentication Utilities
 * 
 * JWT token 生成和验证工具
 */

import jwt from 'jsonwebtoken'
import type { User } from '@/types'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const PLACEHOLDER_SECRET = 'your-secret-key-change-in-production'
const DEV_FALLBACK_SECRET = 'aipiccenter-dev-secret'

const resolvedSecret =
  process.env.JWT_SECRET && process.env.JWT_SECRET !== PLACEHOLDER_SECRET
    ? process.env.JWT_SECRET
    : process.env.NODE_ENV === 'production'
      ? null
      : DEV_FALLBACK_SECRET

const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d'
const AUTH_COOKIE_NAME = 'auth_token'

const TOKEN_MAX_AGE_SECONDS =
  typeof JWT_EXPIRES_IN === 'string' && JWT_EXPIRES_IN.endsWith('d')
    ? parseInt(JWT_EXPIRES_IN.replace('d', ''), 10) * 24 * 60 * 60
    : 7 * 24 * 60 * 60

/**
 * 生成 JWT token
 */
export function generateToken(user: User): string {
  if (!resolvedSecret) {
    throw new Error('JWT_SECRET is not configured')
  }
  return jwt.sign(
    {
      id: user.id,
      phone: user.phone,
      username: user.username,
    },
    resolvedSecret,
    {
      expiresIn: JWT_EXPIRES_IN as string,
    } as jwt.SignOptions
  )
}

/**
 * 验证 JWT token
 */
export function verifyToken(token: string): {
  id: string
  phone: string
  username?: string
} | null {
  try {
    if (!resolvedSecret) {
      return null
    }
    const decoded = jwt.verify(token, resolvedSecret) as {
      id: string
      phone: string
      username?: string
    }
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * 从请求头获取 token
 */
export function getTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}

export function getTokenFromCookies(request: NextRequest): string | null {
  const cookie = request.cookies.get(AUTH_COOKIE_NAME)
  return cookie?.value ?? null
}

export function attachAuthCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TOKEN_MAX_AGE_SECONDS,
    path: '/',
  })
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
}

