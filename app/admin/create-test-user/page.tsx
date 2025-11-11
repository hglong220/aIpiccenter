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
              <li>登录时需要使用验证码</li>
              <li>验证码会在控制台输出（开发环境）</li>
              <li>访问 <a href="/auth" style={{ color: '#0070f3' }}>/auth</a> 进行登录</li>
              <li>输入手机号，点击"发送验证码"</li>
              <li>在终端查看验证码并输入</li>
            </ol>
          </div>

          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
            <h3>💡 快速登录（通过浏览器控制台）：</h3>
            <p>打开浏览器控制台（F12），执行以下代码：</p>
            <pre style={{ 
              padding: '0.5rem', 
              backgroundColor: '#fff', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '0.875rem',
            }}>
{`localStorage.setItem('auth_token', '${result.token}');
localStorage.setItem('auth_user', JSON.stringify(${JSON.stringify(result.user)}));
location.reload();`}
            </pre>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <a
              href="/auth"
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












