'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AuthForm } from '@/components/auth/AuthForm'

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const isGenerateView = pathname?.startsWith('/generate') ?? false
  const isAuthRemoved = pathname === '/auth'
  const hiddenHeader = isGenerateView || isAuthRemoved

  useEffect(() => {
    if (pathname !== '/') {
      setShowAuthModal(false)
    }
  }, [pathname])

  useEffect(() => {
    if (showAuthModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showAuthModal])

  useEffect(() => {
    if (pathname === '/' && searchParams.get('authModal') === '1') {
      setShowAuthModal(true)
    }
  }, [pathname, searchParams])

  if (hiddenHeader) {
    return null
  }

  const navItems: Array<{ href: string; label: string }> = []

  const handleAuthClick = () => {
    setShowAuthModal(true)
  }

  const closeAuthModal = () => {
    setShowAuthModal(false)
    if (pathname === '/' && searchParams.get('authModal') === '1') {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('authModal')
      const nextUrl = params.toString() ? `/?${params.toString()}` : '/'
      router.replace(nextUrl)
    }
  }

  const isActive = (href: string) => pathname === href

  const renderNavLinks = () => (
    <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          style={{
            textDecoration: 'none',
            color: '#1c1c1c',
            fontSize: '15px',
          }}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )

  return (
    <header className="header">
      <div
        className="main-content-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          gap: '24px',
        }}
      >
        <Link href="/" style={{ fontSize: '22px', fontWeight: 700, color: '#1c1c1c', textDecoration: 'none' }}>
          AI Pic Center
        </Link>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>{renderNavLinks()}</div>

        {!user ? (
          <button
            type="button"
            className="btn primary"
            onClick={handleAuthClick}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            登录/注册
          </button>
        ) : (
          <Link
            href="/generate"
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#1c1c1c',
              textDecoration: 'none',
              border: '1px solid #e5e7eb',
              borderRadius: '20px',
              backgroundColor: '#f9fafb',
            }}
          >
            进入控制台
          </Link>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
        aria-expanded={mobileMenuOpen}
        style={{ padding: '8px', cursor: 'pointer', background: 'none', border: 'none', position: 'absolute', right: '48px', top: '50%', transform: 'translateY(-50%)' }}
      >
        {mobileMenuOpen ? (
          <X style={{ width: '24px', height: '24px', color: '#1c1c1c' }} />
        ) : (
          <Menu style={{ width: '24px', height: '24px', color: '#1c1c1c' }} />
        )}
      </button>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden" style={{ padding: '16px 0', borderTop: '1px solid #f0f0f0', backgroundColor: '#FFFFFF' }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'block',
                padding: '12px',
                color: isActive(item.href) ? '#1A73E8' : '#1c1c1c',
                textDecoration: 'none',
                fontSize: '15px',
                fontWeight: isActive(item.href) ? 600 : 400,
              }}
            >
              {item.label}
            </Link>
          ))}
          {!user && (
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                setMobileMenuOpen(false)
                handleAuthClick()
              }}
              style={{ display: 'block', textAlign: 'center', marginTop: '16px', padding: '8px 16px', fontSize: '13px', border: 'none', cursor: 'pointer' }}
            >
              登录/注册
            </button>
          )}
        </div>
      )}

      {showAuthModal && (
        <div
          onClick={closeAuthModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
            zIndex: 1100,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{ position: 'relative', width: '100%', maxWidth: '520px' }}
          >
            <button
              type="button"
              onClick={closeAuthModal}
              style={{
                position: 'absolute',
                top: '-16px',
                right: '-16px',
                width: '36px',
                height: '36px',
                borderRadius: '18px',
                border: 'none',
                backgroundColor: '#111827',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 24px rgba(15, 23, 42, 0.18)',
              }}
            >
              <X style={{ width: '18px', height: '18px' }} />
            </button>
            <AuthForm
              initialMode="login"
              redirect="/generate"
              onSuccess={() => {
                closeAuthModal()
                router.push('/generate')
              }}
              isEmbedded
            />
          </div>
        </div>
      )}
    </header>
  )
}

