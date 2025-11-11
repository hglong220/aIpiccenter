/**
 * Payment Failed Page
 * 
 * 支付失败页面
 */

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function PaymentFailedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const error = searchParams.get('error') || '支付失败，请稍后再试'

  return (
    <div style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: '600px', backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '40px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
        <XCircle style={{ width: '80px', height: '80px', color: '#ef4444', margin: '0 auto 24px' }} />
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#1c1c1c', marginBottom: '16px' }}>支付失败</h1>
        <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '32px' }}>
          {error}
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link
            href="/pricing"
            className="btn primary"
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <RefreshCw style={{ width: '20px', height: '20px' }} />
            重新支付
          </Link>
          <Link
            href="/"
            className="btn secondary"
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <ArrowLeft style={{ width: '20px', height: '20px' }} />
            返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}

