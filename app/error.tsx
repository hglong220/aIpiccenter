'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', padding: '20px' }}>
      <div style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
        <div style={{ marginBottom: '24px' }}>
          <AlertCircle style={{ width: '64px', height: '64px', color: '#ef4444', margin: '0 auto' }} />
        </div>
        <h1 style={{ fontSize: '48px', fontWeight: 700, color: '#1c1c1c', marginBottom: '16px' }}>
          出错了！
        </h1>
        <p style={{ fontSize: '18px', color: '#666', marginBottom: '32px' }}>
          {error.message || '发生了意外错误'}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center', alignItems: 'center' }}>
          <button
            onClick={reset}
            className="btn primary"
            style={{ minWidth: '150px' }}
          >
            重试
          </button>
          <Link
            href="/"
            className="btn secondary"
            style={{ display: 'inline-block', textDecoration: 'none', minWidth: '150px', textAlign: 'center' }}
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}

