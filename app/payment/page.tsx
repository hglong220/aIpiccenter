/**
 * Payment Page
 * 
 * 支付页面
 * 支持微信支付
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { CreditCard, Loader2, CheckCircle2, XCircle } from 'lucide-react'

export default function PaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [payUrl, setPayUrl] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)

  // 从 URL 参数获取计划信息
  const planId = searchParams.get('planId')
  const planName = searchParams.get('planName')
  const price = searchParams.get('price')
  const credits = searchParams.get('credits')

  // 检查用户是否登录并创建订单
  useEffect(() => {
    if (!user) {
      toast.error('请先登录')
      router.push('/?redirect=/payment')
      return
    }

    // 如果没有计划信息，返回定价页面
    if (!planId || !planName || !price || !credits) {
      toast.error('请选择订阅计划')
      router.push('/pricing')
      return
    }

    // 创建订单
    void createOrder()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 创建订单
  const createOrder = async () => {
    if (!user || !planId || !planName || !price || !credits) return

    setLoading(true)

    try {
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          planId,
          planName,
          amount: parseFloat(price),
          credits: parseInt(credits, 10),
        }),
      })

      const data = await response.json()

      if (response.ok && data.success && data.data) {
        setOrderId(data.data.id)
        if (data.data.payUrl) {
          setPayUrl(data.data.payUrl)
          // 跳转到微信支付页面
          // 注意：实际支付完成后，微信会回调 /api/payment/wechat/notify
          // 然后可以跳转到 /payment/success?orderId=xxx&planName=xxx
          window.location.href = data.data.payUrl
        } else {
          toast.error('获取支付链接失败')
        }
      } else {
        toast.error(data.error || '创建订单失败')
        router.push('/pricing')
      }
    } catch (error) {
      console.error('创建订单错误:', error)
      toast.error('创建订单失败，请稍后再试')
      router.push('/pricing')
    } finally {
      setLoading(false)
    }
  }

  // 如果没有计划信息，显示加载状态
  if (!planId || !planName || !price || !credits) {
    return (
      <div style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 style={{ width: '48px', height: '48px', color: '#1A73E8', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '16px', color: '#6b7280' }}>正在加载...</p>
        </div>
      </div>
    )
  }

  // 如果用户未登录，显示加载状态
  if (!user) {
    return (
      <div style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 style={{ width: '48px', height: '48px', color: '#1A73E8', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '16px', color: '#6b7280' }}>正在跳转到首页...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: '600px', backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '40px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
        {loading ? (
          <div style={{ textAlign: 'center' }}>
            <Loader2 style={{ width: '48px', height: '48px', color: '#1A73E8', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1c1c1c', marginBottom: '8px' }}>正在创建订单...</h2>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>请稍候</p>
          </div>
        ) : payUrl ? (
          <div style={{ textAlign: 'center' }}>
            <CheckCircle2 style={{ width: '64px', height: '64px', color: '#10b981', margin: '0 auto 24px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1c1c1c', marginBottom: '8px' }}>订单创建成功</h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>正在跳转到微信支付...</p>
            <div style={{ backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>计划名称</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1c1c1c' }}>{planName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>支付金额</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#1A73E8' }}>¥{price}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>获得信用点</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1c1c1c' }}>{credits} 点</span>
              </div>
            </div>
            <button
              onClick={() => {
                if (payUrl) {
                  window.location.href = payUrl
                }
              }}
              className="btn primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                fontWeight: 600,
                marginBottom: '16px',
              }}
            >
              <CreditCard style={{ width: '20px', height: '20px', display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
              前往微信支付
            </button>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '16px' }}>
              如果页面没有自动跳转，请点击上方按钮
            </p>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <XCircle style={{ width: '64px', height: '64px', color: '#ef4444', margin: '0 auto 24px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1c1c1c', marginBottom: '8px' }}>创建订单失败</h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>请返回重新选择计划</p>
            <button
              onClick={() => router.push('/pricing')}
              className="btn primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                fontWeight: 600,
              }}
            >
              返回定价页面
            </button>
          </div>
        )}

        {/* 安全提示 */}
        <div style={{ marginTop: '32px', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px', fontSize: '12px', color: '#6b7280', lineHeight: '1.5' }}>
          <strong>安全提示：</strong>我们使用微信支付进行安全支付，不会存储您的支付密码。支付完成后，信用点将自动充值到您的账户。
        </div>
      </div>
    </div>
  )
}

