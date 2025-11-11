/**
 * Payment Success Page
 * 
 * 支付成功页面
 */

'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { CheckCircle2, CreditCard, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshUser } = useAuth()

  const orderId = searchParams.get('orderId')
  const planName = searchParams.get('planName')

  useEffect(() => {
    // 刷新用户信息以更新信用点
    refreshUser()
  }, [])

  return (
    <div style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: '600px', backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '40px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
        <CheckCircle2 style={{ width: '80px', height: '80px', color: '#10b981', margin: '0 auto 24px' }} />
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#1c1c1c', marginBottom: '16px' }}>支付成功</h1>
        <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '32px' }}>
          感谢您的购买！{planName && `您已成功购买 ${planName}。`}信用点已充值到您的账户。
        </p>

        {orderId && (
          <div style={{ backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '16px', marginBottom: '32px', textAlign: 'left' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>订单号</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#1c1c1c' }}>{orderId}</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link
            href="/account"
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
            <CreditCard style={{ width: '20px', height: '20px' }} />
            查看账户
          </Link>
          <Link
            href="/generate"
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
            开始生成
            <ArrowRight style={{ width: '20px', height: '20px' }} />
          </Link>
        </div>
      </div>
    </div>
  )
}

