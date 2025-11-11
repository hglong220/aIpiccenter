/**
 * Authentication Context
 * 
 * 用户认证状态管理
 */

'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { User, AuthResponse } from '@/types'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (phone: string, code: string, username?: string, password?: string, loginType?: 'code' | 'password') => Promise<boolean>
  register: (phone: string, code: string, username?: string, password?: string) => Promise<boolean>
  logout: () => void
  refreshUser: () => Promise<void>
  sendCode: (phone: string, type: 'register' | 'login' | 'reset') => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // 初始化：从 localStorage 恢复用户状态
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('auth_user')

    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
        // 验证 token 是否有效
        refreshUser()
      } catch (error) {
        console.error('恢复用户状态失败:', error)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 发送验证码
  const sendCode = async (
    phone: string,
    type: 'register' | 'login' | 'reset'
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, type }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('验证码已发送')
        return true
      } else {
        toast.error(data.error || '发送验证码失败')
        return false
      }
    } catch (error) {
      console.error('发送验证码错误:', error)
      toast.error('发送验证码失败，请稍后再试')
      return false
    }
  }

  // 注册
  const register = async (
    phone: string,
    code: string,
    username?: string,
    password?: string
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, code, username, password }),
      })

      const data: { success: boolean; data?: AuthResponse; error?: string } = await response.json()

      if (data.success && data.data) {
        setUser(data.data.user)
        setToken(data.data.token)
        localStorage.setItem('auth_token', data.data.token)
        localStorage.setItem('auth_user', JSON.stringify(data.data.user))
        toast.success('注册成功')
        return true
      } else {
        toast.error(data.error || '注册失败')
        return false
      }
    } catch (error) {
      console.error('注册错误:', error)
      toast.error('注册失败，请稍后再试')
      return false
    }
  }

  // 登录
  const login = async (
    phone: string,
    code: string,
    username?: string,
    password?: string,
    loginType: 'code' | 'password' = 'code'
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, code, username, password, loginType }),
      })

      const data: { success: boolean; data?: AuthResponse; error?: string } = await response.json()

      if (data.success && data.data) {
        setUser(data.data.user)
        setToken(data.data.token)
        localStorage.setItem('auth_token', data.data.token)
        localStorage.setItem('auth_user', JSON.stringify(data.data.user))
        toast.success('登录成功')
        return true
      } else {
        toast.error(data.error || '登录失败')
        return false
      }
    } catch (error) {
      console.error('登录错误:', error)
      toast.error('登录失败，请稍后再试')
      return false
    }
  }

  // 登出
  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    toast.success('已退出登录')
  }

  // 刷新用户信息
  const refreshUser = async () => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data: { success: boolean; data?: User; error?: string } = await response.json()

      if (data.success && data.data) {
        setUser(data.data)
        localStorage.setItem('auth_user', JSON.stringify(data.data))
      } else {
        // Token 无效，清除状态
        logout()
      }
    } catch (error) {
      console.error('刷新用户信息错误:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshUser,
        sendCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

