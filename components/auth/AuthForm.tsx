'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

const PHONE_REGEX = /^1[3-9]\d{9}$/

type AuthMode = 'login' | 'register' | 'forgot-password'
type LoginMethod = 'code' | 'password'

interface AuthFormProps {
  initialMode?: AuthMode
  redirect?: string | null
  onSuccess?: () => void
  isEmbedded?: boolean
}

export function AuthForm({ initialMode = 'login', redirect = '/', onSuccess, isEmbedded = false }: AuthFormProps) {
  const router = useRouter()
  const { login, register, sendCode, resetPassword } = useAuth()

  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  useEffect(() => {
    if (mode !== 'login') {
      setLoginMethod('code')
    } else {
      // 切换到登录模式时，默认使用密码登录
      setLoginMethod('password')
    }
  }, [mode])

  const currentCodeType: 'register' | 'login' | 'reset' = mode === 'register' ? 'register' : mode === 'forgot-password' ? 'reset' : 'login'

  const handleSendCode = async () => {
    if (!PHONE_REGEX.test(phone)) {
      toast.error('请输入有效的手机号')
      return
    }

    setLoading(true)
    const success = await sendCode(phone, currentCodeType)
    setLoading(false)

    if (success) {
      setCountdown(60)
    }
  }

  const handleLogin = async () => {
    if (!PHONE_REGEX.test(phone)) {
      toast.error('请输入有效的手机号')
      return
    }

    if (loginMethod === 'code') {
      if (!code) {
        toast.error('请输入验证码')
        return
      }

      setLoading(true)
      const success = await login(phone, code)
      setLoading(false)

      if (success) {
        onSuccess?.()
        if (redirect && redirect !== '__stay__') {
          router.replace(redirect)
        }
      }
    } else {
      if (!password) {
        toast.error('请输入密码')
        return
      }

      setLoading(true)
      const success = await login(phone, '', { password })
      setLoading(false)

      if (success) {
        onSuccess?.()
        if (redirect && redirect !== '__stay__') {
          router.replace(redirect)
        }
      }
    }
  }

  const handleRegister = async () => {
    if (!username.trim()) {
      toast.error('请输入用户名')
      return
    }

    if (!PHONE_REGEX.test(phone)) {
      toast.error('请输入有效的手机号')
      return
    }

    if (!code) {
      toast.error('请输入验证码')
      return
    }

    if (password.length < 8) {
      toast.error('密码长度至少为 8 位')
      return
    }

    if (password !== confirmPassword) {
      toast.error('两次输入的密码不一致')
      return
    }

    setLoading(true)
    const success = await register(phone, code, username.trim(), password)
    setLoading(false)

    if (success) {
      onSuccess?.()
      if (redirect && redirect !== '__stay__') {
        router.replace(redirect)
      }
    }
  }

  const handleResetPassword = async () => {
    if (!PHONE_REGEX.test(phone)) {
      toast.error('请输入有效的手机号')
      return
    }

    if (!code) {
      toast.error('请输入验证码')
      return
    }

    if (password.length < 8) {
      toast.error('密码长度至少为 8 位')
      return
    }

    if (password !== confirmPassword) {
      toast.error('两次输入的密码不一致')
      return
    }

    setLoading(true)
    const success = await resetPassword(phone, code, password)
    setLoading(false)

    if (success) {
      toast.success('密码已重置，请使用新密码登录')
      setMode('login')
      setCode('')
      setPassword('')
      setConfirmPassword('')
      setCountdown(0)
      setLoginMethod('password')
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (mode === 'login') {
      void handleLogin()
    } else if (mode === 'register') {
      void handleRegister()
    } else {
      void handleResetPassword()
    }
  }

  const handleModeSwitch = (newMode: AuthMode) => {
    setMode(newMode)
    setCode('')
    setPassword('')
    setConfirmPassword('')
    setCountdown(0)
    // 登录模式默认使用密码登录，其他模式使用验证码
    setLoginMethod(newMode === 'login' ? 'password' : 'code')
  }

  const outerStyle = isEmbedded
    ? { width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '8px 0' }
    : { minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px 10px' };

  const cardStyle = {
    width: '100%',
    maxWidth: '360px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: isEmbedded ? '16px' : '18px',
    boxShadow: isEmbedded ? '0 18px 48px rgba(15, 23, 42, 0.16)' : '0 4px 6px rgba(0, 0, 0, 0.1)',
  } as const;

  return (
    <div style={outerStyle}>
      <div style={cardStyle}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#1c1c1c', marginBottom: '6px', textAlign: 'center' }}>
          {mode === 'login' ? '登录' : mode === 'register' ? '注册新账号' : '找回密码'}
        </h1>
        <p style={{ fontSize: '11px', color: '#6b7280', textAlign: 'center', marginBottom: '10px' }}>
          {mode === 'login' && (loginMethod === 'password' ? '输入用户名或手机号加密码直接登录' : '输入手机号并验证即可登录，无需记住密码')}
          {mode === 'register' && '手机号将作为您的唯一账号，请完善信息并设置密码'}
          {mode === 'forgot-password' && '输入手机号与验证码，重置您的登录密码'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {mode === 'login' && (
            <div style={{ display: 'flex', gap: '6px', background: '#f3f4f6', padding: '3px', borderRadius: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('password')
                  setCode('')
                  setCountdown(0)
                }}
                style={{
                  flex: 1,
                  padding: '7px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: loginMethod === 'password' ? '#FFFFFF' : 'transparent',
                  color: loginMethod === 'password' ? '#1c1c1c' : '#6b7280',
                  boxShadow: loginMethod === 'password' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                密码登录
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('code')
                  setPassword('')
                  // 如果当前输入的不是有效的手机号，清空它
                  if (phone && !PHONE_REGEX.test(phone)) {
                    setPhone('')
                  }
                }}
                style={{
                  flex: 1,
                  padding: '7px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: loginMethod === 'code' ? '#FFFFFF' : 'transparent',
                  color: loginMethod === 'code' ? '#1c1c1c' : '#6b7280',
                  boxShadow: loginMethod === 'code' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                验证码登录
              </button>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1c1c1c', marginBottom: '8px' }}>
                用户名 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="请输入用户名（3-30 个字符）"
                maxLength={30}
                className="input-primary"
                required
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#1c1c1c', marginBottom: '5px' }}>
              {loginMethod === 'password' ? '用户名 / 手机号' : '手机号'} <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder={loginMethod === 'password' ? '请输入用户名或手机号' : '请输入手机号'}
              maxLength={loginMethod === 'password' ? 30 : 11}
              className="input-primary"
              required
            />
          </div>

          {mode === 'login' && loginMethod === 'password' ? (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#1c1c1c', marginBottom: '4px' }}>
                密码 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="请输入密码"
                minLength={8}
                maxLength={64}
                className="input-primary"
                required
              />
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#1c1c1c', marginBottom: '4px' }}>
                验证码 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/[^\d]/g, ''))}
                  placeholder="请输入验证码"
                  maxLength={6}
                  className="input-primary"
                  required
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={loading || countdown > 0}
                  className="btn secondary"
                  style={{ whiteSpace: 'nowrap', padding: '0 14px', fontSize: '13px', opacity: loading || countdown > 0 ? 0.6 : 1 }}
                >
                  {countdown > 0 ? `${countdown}s 后可重试` : '获取验证码'}
                </button>
              </div>
            </div>
          )}

          {mode !== 'login' && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1c1c1c', marginBottom: '8px' }}>
                  {mode === 'register' ? '设置密码' : '新密码'} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="至少 8 位，建议包含字母和数字"
                  minLength={8}
                  maxLength={64}
                  className="input-primary"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1c1c1c', marginBottom: '8px' }}>
                  确认密码 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="请再次输入密码"
                  minLength={8}
                  maxLength={64}
                  className="input-primary"
                  required
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn primary"
            style={{ marginTop: '6px', padding: '9px', fontSize: '14px', fontWeight: 600, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '登录中...' : mode === 'login' ? '立即登录' : mode === 'register' ? '立即注册' : '确认重置'}
          </button>
        </form>

        {mode === 'login' && (
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6b7280', transform: 'translateY(-4px)' }}>
            <button
              type="button"
              onClick={() => {
                setMode('forgot-password')
                setCode('')
                setPassword('')
                setConfirmPassword('')
                setCountdown(0)
                setLoginMethod('code')
              }}
              style={{ color: '#1A73E8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              忘记密码？
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register')
                setCode('')
                setPassword('')
                setConfirmPassword('')
                setCountdown(0)
                setLoginMethod('code')
              }}
              style={{ color: '#1A73E8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              没有账号？立即注册
            </button>
          </div>
        )}

        {mode === 'register' && (
          <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px', color: '#6b7280' }}>
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setPassword('')
                setConfirmPassword('')
                setCountdown(0)
                setLoginMethod('password')
              }}
              style={{ color: '#1A73E8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              已有账号？前往登录
            </button>
          </div>
        )}

        {mode === 'forgot-password' && (
          <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px', color: '#6b7280' }}>
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setCode('')
                setPassword('')
                setConfirmPassword('')
                setCountdown(0)
                setLoginMethod('password')
              }}
              style={{ color: '#1A73E8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              返回登录
            </button>
          </div>
        )}
        <div style={{ marginTop: '4px', textAlign: 'center', fontSize: '12px', color: '#6b7280', display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span>继续操作即表示您同意</span>
          <a href="/terms" style={{ color: '#1A73E8', textDecoration: 'none' }}>《服务协议》</a>
          <span>和</span>
          <a href="/privacy" style={{ color: '#1A73E8', textDecoration: 'none' }}>《隐私政策》</a>
        </div>
      </div>
    </div>
  )
}
