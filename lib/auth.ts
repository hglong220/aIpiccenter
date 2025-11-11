/**
 * Authentication Utilities
 * 
 * JWT token 生成和验证工具
 */

import jwt from 'jsonwebtoken'
import type { User } from '@/types'

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d'

/**
 * 生成 JWT token
 */
export function generateToken(user: User): string {
  if (!JWT_SECRET || JWT_SECRET === 'your-secret-key-change-in-production') {
    throw new Error('JWT_SECRET is not configured')
  }
  return jwt.sign(
    {
      id: user.id,
      phone: user.phone,
      username: user.username,
    },
    JWT_SECRET as string,
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
    if (!JWT_SECRET || JWT_SECRET === 'your-secret-key-change-in-production') {
      return null
    }
    const decoded = jwt.verify(token, JWT_SECRET as string) as {
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

