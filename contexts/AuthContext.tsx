/**
 * Authentication Context
 *
 * 用户认证状态管理
 */

'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { User } from '@/types'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (phone: string, code: string, options?: { password?: string }) => Promise<boolean>
  register: (phone: string, code: string, username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  sendCode: (phone: string, type: 'register' | 'login' | 'reset') => Promise<boolean>
  resetPassword: (phone: string, code: string, newPassword: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void refreshUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sendCode = async (phone: string, type: 'register' | 'login' | 'reset'): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, type }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('验证码已发送')
        return true
      }

      toast.error(data.error || '验证码发送失败')
      return false
    } catch (error) {
      console.error('发送验证码错误:', error)
      toast.error('发送验证码失败，请稍后再试')
      return false
    }
  }

  const register = async (phone: string, code: string, username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ phone, code, username, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('注册成功')
        await refreshUser()
        return true
      }

      toast.error(data.error || '注册失败')
      return false
    } catch (error) {
      console.error('注册错误:', error)
      toast.error('注册失败，请稍后再试')
      return false
    }
  }

  const login = async (phone: string, code: string, options?: { password?: string }): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ phone, code, password: options?.password, loginType: options?.password ? 'password' : 'code' }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        await refreshUser()
        return true
      }

      toast.error(data.error || '登录失败')
      return false
    } catch (error) {
      console.error('登录错误:', error)
      toast.error('登录失败，请稍后再试')
      return false
    }
  }

  const resetPassword = async (phone: string, code: string, newPassword: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, code, newPassword }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('密码重置成功')
        return true
      }

      toast.error(data.error || '密码重置失败')
      return false
    } catch (error) {
      console.error('重置密码错误:', error)
      toast.error('密码重置失败，请稍后再试')
      return false
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('退出登录错误:', error)
    } finally {
      setUser(null)
      toast.success('已退出登录')
      window.location.href = '/?authModal=1'
    }
  }

  const refreshUser = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      })

      if (!response.ok) {
        const message = await response.text()
        console.warn('refreshUser failed:', response.status, message)
        setUser(null)
        return
      }

      const data: { success: boolean; data?: User; error?: string } = await response.json()
      if (data.success && data.data) {
        setUser(data.data)
      } else {
        console.warn('refreshUser response error:', data.error || 'Unknown error')
        setUser(null)
      }
    } catch (error) {
      console.error('刷新用户信息错误:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        sendCode,
        resetPassword,
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

