'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

export default function CreateTestUserPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleCreate = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/create-test-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.data)
        toast.success('测试账号创建成功！')
      } else {
        toast.error(data.error || '创建失败')
      }
    } catch (error) {
      console.error('创建失败:', error)
      toast.error('创建失败，请检查控制台')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem' }}>创建测试管理员账号</h1>
      
      <button
        onClick={handleCreate}
        disabled={loading}
        style={{
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? '创建中...' : '创建测试账号'}
      </button>

      {result && (
        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <h2 style={{ marginBottom: '1rem' }}>✅ 测试账号创建成功！</h2>
          
          <div style={{ marginBottom: '1rem' }}>
            <h3>登录信息：</h3>
            <p><strong>手机号:</strong> {result.user.phone}</p>
            <p><strong>用户名:</strong> {result.user.username || '未设置'}</p>
            <p><strong>信用点:</strong> {result.user.credits}</p>
            <p><strong>订阅计划:</strong> {result.user.plan}</p>
          </div>

          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fff', borderRadius: '4px' }}>
            <h3>⚠️ 重要提示：</h3>
            <ol style={{ paddingLeft: '1.5rem' }}>
              <li>登录时使用手机号接收验证码，无需输入密码</li>
              <li>验证码会在终端输出（开发环境）</li>
              <li>访问 <a href="/" style={{ color: '#0070f3' }}>/</a> 完成登录</li>
              <li>输入手机号，点击“获取验证码”提交登录</li>
            </ol>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <a
              href="/"
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#0070f3',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
              }}
            >
              前往登录页面
            </a>
          </div>
        </div>
      )}
    </div>
  )
}












