'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { Phone, User as UserIcon, Lock, MessageSquare } from 'lucide-react'

type AuthMode = 'login' | 'register' | 'forgot-password'
type LoginType = 'password' | 'code'

interface AuthFormProps {
  initialMode?: AuthMode
  redirect?: string | null
  onSuccess?: () => void
  isEmbedded?: boolean
}

export function AuthForm({ initialMode = 'login', redirect = '/', onSuccess, isEmbedded = false }: AuthFormProps) {
  const router = useRouter()
  const { login, register, sendCode } = useAuth()
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [loginType, setLoginType] = useState<LoginType>('password')
  const [phone, setPhone] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSendCode = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      toast.error('请输入正确的手机号')
      return
    }

    const codeType = mode === 'forgot-password' ? 'reset' : mode
    setLoading(true)
    const success = await sendCode(phone, codeType)
    setLoading(false)

    if (success) {
      setCountdown(60)
    }
  }

  const handleResetPassword = async () => {
    if (!phone || !code || !password) {
      toast.error('请填写完整信息')
      return
    }

    if (password !== confirmPassword) {
      toast.error('两次输入的密码不一致')
      return
    }

    if (password.length < 6 || password.length > 20) {
      toast.error('密码长度必须在6-20个字符之间')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, code, newPassword: password }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('密码重置成功，请使用新密码登录')
        setMode('login')
        setPhone('')
        setCode('')
        setPassword('')
        setConfirmPassword('')
      } else {
        toast.error(data.error || '重置密码失败')
      }
    } catch (error) {
      console.error('重置密码错误:', error)
      toast.error('重置密码失败，请稍后再试')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (mode === 'forgot-password') {
      handleResetPassword()
      return
    }

    if (mode === 'register') {
      if (!username) {
        toast.error('请输入用户名')
        return
      }

      if (username.length < 3 || username.length > 20) {
        toast.error('用户名长度必须在3-20个字符之间')
        return
      }

      if (!password) {
        toast.error('请输入密码')
        return
      }

      if (password.length < 6 || password.length > 20) {
        toast.error('密码长度必须在6-20个字符之间')
        return
      }

      if (password !== confirmPassword) {
        toast.error('两次输入的密码不一致')
        return
      }

      if (!phone || !code) {
        toast.error('请输入手机号和验证码')
        return
      }

      setLoading(true)
      const success = await register(phone, code, username, password)
      if (success) {
        onSuccess?.()
        if (redirect && redirect !== '__stay__') {
          router.push(redirect)
        }
      }
      setLoading(false)
    } else {
      if (loginType === 'password') {
        if (!password) {
          toast.error('请输入密码')
          return
        }

        const inputValue = phone || username
        if (!inputValue) {
          toast.error('请输入手机号或用户名')
          return
        }

        const isPhone = /^1[3-9]\d{9}$/.test(inputValue)

        setLoading(true)
        const success = await login(
          isPhone ? inputValue : '',
          '',
          isPhone ? undefined : inputValue,
          password,
          'password'
        )
        if (success) {
          onSuccess?.()
          if (redirect && redirect !== '__stay__') {
            router.push(redirect)
          }
        }
        setLoading(false)
      } else {
        if (!phone || !code) {
          toast.error('请输入手机号和验证码')
          return
        }

        setLoading(true)
        const success = await login(phone, code, undefined, undefined, 'code')
        if (success) {
          onSuccess?.()
          if (redirect && redirect !== '__stay__') {
            router.push(redirect)
          }
        }
        setLoading(false)
      }
    }
  }

  const outerStyle = isEmbedded
    ? { width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px 0' as const }
    : { minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' as const }

  const cardStyle = {
    width: '100%',
    maxWidth: '480px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: isEmbedded ? '32px' : '40px',
    boxShadow: isEmbedded ? '0 18px 48px rgba(15, 23, 42, 0.16)' : '0 4px 6px rgba(0, 0, 0, 0.1)',
  } as const

  const renderForgotPassword = () => (
    <div style={cardStyle}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1c1c1c', marginBottom: '8px', textAlign: 'center' }}>忘记密码</h1>
      <p style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center', marginBottom: '32px' }}>通过手机验证码重置密码</p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1c1c1c', marginBottom: '8px' }}>
            手机号 <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <Phone style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#9ca3af' }} />
            <input
              type='tel'
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder='请输入手机号'
              maxLength={11}
              className='input-primary'
              style={{ paddingLeft: '44px' }}
              required
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1c1c1c', marginBottom: '8px' }}>
            验证码 <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <MessageSquare style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#9ca3af' }} />
              <input
                type='text'
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder='请输入验证码'
                maxLength={6}
                className='input-primary'
                style={{ paddingLeft: '44px' }}
                required
              />
            </div>
            <button
              type='button'
              onClick={handleSendCode}
              disabled={!phone || countdown > 0 || loading}
              className='btn secondary'
              style={{
                padding: '0 20px',
                whiteSpace: 'nowrap',
                height: '44px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: !phone || countdown > 0 || loading ? 0.5 : 1,
                cursor: !phone || countdown > 0 || loading ? 'not-allowed' : 'pointer',
              }}
            >
              {countdown > 0 ? `${countdown}秒` : '发送验证码'}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1c1c1c', marginBottom: '8px' }}>
            新密码 <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#9ca3af' }} />
            <input
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='请输入新密码（6-20个字符）'
              minLength={6}
              maxLength={20}
              className='input-primary'
              style={{ paddingLeft: '44px' }}
              required
            />
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1c1c1c', marginBottom: '8px' }}>
            确认密码 <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#9ca3af' }} />
            <input
              type='password'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder='请再次输入密码'
              minLength={6}
              maxLength={20}
              className='input-primary'
              style={{ paddingLeft: '44px' }}
              required
            />
          </div>
        </div>

        <button
          type='submit'
          disabled={loading}
          className='btn primary'
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            fontWeight: 600,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '处理中...' : '重置密码'}
        </button>
      </form>

      <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
        <button
          type='button'
          onClick={() => {
            setMode('login')
            setPhone('')
            setCode('')
            setPassword('')
            setConfirmPassword('')
          }}
          style={{ color: '#1A73E8', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
        >
          返回登录
        </button>
      </div>
    </div>
  )

  const renderAuthContent = () => {
    return (
      <div style={cardStyle}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1c1c1c', marginBottom: '8px', textAlign: 'center' }}>{mode === 'login' ? '登录' : '注册'}</h1>
        {mode === 'login' && <div style={{ height: '32px' }} />}

        {mode === 'login' && (
          <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', backgroundColor: '#f3f4f6', padding: '4px', borderRadius: '8px' }}>
            <button
              type='button'
              onClick={() => {
                setLoginType('password')
                setCode('')
                setPassword('')
                setPhone('')
                setUsername('')
              }}
              style={{
                flex: 1,
                padding: '10px',
                fontSize: '14px',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: loginType === 'password' ? '#FFFFFF' : 'transparent',
                color: loginType === 'password' ? '#1c1c1c' : '#6b7280',
                boxShadow: loginType === 'password' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              密码登录
            </button>
            <button
              type='button'
              onClick={() => {
                setLoginType('code')
                setPassword('')
                setUsername('')
              }}
              style={{
                flex: 1,
                padding: '10px',
                fontSize: '14px',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: loginType === 'code' ? '#FFFFFF' : 'transparent',
                color: loginType === 'code' ? '#1c1c1c' : '#6b7280',
                boxShadow: loginType === 'code' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              验证码登录
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1c1c1c', marginBottom: '8px' }}>
                用户名 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <UserIcon style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#9ca3af' }} />
                <input
                  type='text'
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder='请输入用户名'
                  minLength={3}
                  maxLength={20}
                  className='input-primary'
                  style={{ paddingLeft: '44px' }}
                  required
                />
              </div>
            </div>
          )}

          {mode !== 'register' && loginType === 'password' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1c1c1c', marginBottom: '8px' }}>
                手机号 / 用户名 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <UserIcon style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#9ca3af' }} />
                <input
                  type='text'
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder='请输入手机号或用户名'
                  maxLength={20}
                  className='input-primary'
                  style={{ paddingLeft: '44px' }}
                  required
                />
              </div>
            </div>
          )}

          {(mode === 'register' || loginType === 'code') && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1c1c1c', marginBottom: '8px' }}>
                手机号 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Phone style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#9ca3af' }} />
                <input
                  type='tel'
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder='请输入手机号'
                  maxLength={11}
                  className='input-primary'
                  style={{ paddingLeft: '44px' }}
                  required
                />
              </div>
            </div>
          )}

          {(mode === 'register' || loginType === 'code') && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1c1c1c', marginBottom: '8px' }}>
                验证码 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <MessageSquare style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#9ca3af' }} />
                  <input
                    type='text'
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder='请输入验证码'
                    maxLength={6}
                    className='input-primary'
                    style={{ paddingLeft: '44px' }}
                    required
                  />
                </div>
                <button
                  type='button'
                  onClick={handleSendCode}
                  disabled={!phone || countdown > 0 || loading}
                  className='btn secondary'
                  style={{
                    padding: '0 20px',
                    whiteSpace: 'nowrap',
                    height: '44px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: !phone || countdown > 0 || loading ? 0.5 : 1,
                    cursor: !phone || countdown > 0 || loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {countdown > 0 ? `${countdown}秒` : '发送验证码'}
                </button>
              </div>
            </div>
          )}

          {mode !== 'forgot-password' && loginType === 'password' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1c1c1c', marginBottom: '8px' }}>
                密码 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#9ca3af' }} />
                <input
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='请输入密码'
                  minLength={6}
                  maxLength={20}
                  className='input-primary'
                  style={{ paddingLeft: '44px' }}
                  required
                />
              </div>
              {mode === 'login' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button
                    type='button'
                    onClick={() => {
                      setMode('forgot-password')
                      setLoginType('password')
                      setUsername('')
                      setPassword('')
                      setConfirmPassword('')
                      setPhone('')
                      setCode('')
                    }}
                    style={{ color: '#1A73E8', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', padding: 0 }}
                  >
                    忘记密码?
                  </button>
                </div>
              )}
            </div>
          )}

          {mode === 'register' && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1c1c1c', marginBottom: '8px' }}>
                确认密码 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#9ca3af' }} />
                <input
                  type='password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder='请再次输入密码'
                  minLength={6}
                  maxLength={20}
                  className='input-primary'
                  style={{ paddingLeft: '44px' }}
                  required
                />
              </div>
            </div>
          )}

          <button
            type='submit'
            disabled={loading}
            className='btn primary'
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              fontWeight: 600,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
          </button>
          {mode === 'register' && (
            <p
              style={{
                marginTop: '12px',
                fontSize: '12px',
                color: '#6b7280',
                textAlign: 'center',
                lineHeight: 1.6,
              }}
            >
              注册即代表已阅读并同意我们的{' '}
              <a href='/terms' style={{ color: '#1A73E8', textDecoration: 'none' }}>
                《用户协议》
              </a>{' '}
              与{' '}
              <a href='/privacy' style={{ color: '#1A73E8', textDecoration: 'none' }}>
                《隐私政策》
              </a>
            </p>
          )}
        </form>

        <div
          style={{
            marginTop: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '16px',
            fontSize: '13px',
            color: '#6b7280',
          }}
        >
          <button
            type='button'
            onClick={() => {
              if (mode === 'login') {
                setMode('register')
                setUsername('')
                setPassword('')
                setConfirmPassword('')
                setPhone('')
                setCode('')
                setLoginType('password')
              } else {
                setMode('login')
                setUsername('')
                setPassword('')
                setConfirmPassword('')
                setPhone('')
                setCode('')
                setLoginType('password')
              }
            }}
            style={{ color: '#1A73E8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {mode === 'login' ? '立即注册' : '已有账号？去登录'}
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'forgot-password') {
    const content = renderForgotPassword()
    if (isEmbedded) {
      return <div style={outerStyle}>{content}</div>
    }
    return <div style={outerStyle}>{content}</div>
  }

  const content = renderAuthContent()
  if (isEmbedded) {
    return <div style={outerStyle}>{content}</div>
  }
  return <div style={outerStyle}>{content}</div>
}
