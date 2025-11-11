'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GeminiHero } from '@/components/home/GeminiHero'
import { useAuth } from '@/contexts/AuthContext'

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      router.replace('/generate')
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}>
        <span style={{ fontSize: '14px', color: '#6b7280' }}>加载中…</span>
      </div>
    )
  }

  if (user) {
    return null
  }

  return (
    <>
      <GeminiHero />
    </>
  )
}
