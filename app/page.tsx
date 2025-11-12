'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { GeminiHero } from '@/components/home/GeminiHero'

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      router.replace('/generate')
    }
  }, [loading, user, router])

  if (!loading && user) {
    return null
  }

  return (
    <>
      <GeminiHero />
    </>
  )
}
