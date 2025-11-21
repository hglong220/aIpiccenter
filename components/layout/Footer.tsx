'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Footer() {
  const pathname = usePathname()
  const currentYear = new Date().getFullYear()

  const hiddenPaths = ['/generate', '/video', '/analysis']
  const shouldHide = hiddenPaths.some((path) => pathname === path)

  if (shouldHide) {
    return null
  }

  return (
    <footer
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid rgba(229, 231, 235, 0.8)',
        zIndex: 120,
      }}
    >
      <div
        className="main-content-container"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '56px',
          gap: '24px',
          flexWrap: 'wrap',
          padding: '12px 16px',
          fontSize: '12px',
          color: '#6b7280',
        }}
      >
        <span>© {currentYear} AI Pic Center. All rights reserved.</span>
        <Link href="/privacy" style={{ textDecoration: 'none', color: '#6b7280' }}>
          隐私政策
        </Link>
        <Link href="/terms" style={{ textDecoration: 'none', color: '#6b7280' }}>
          服务条款
        </Link>
        <Link href="/contact" style={{ textDecoration: 'none', color: '#6b7280' }}>
          联系我们
        </Link>
      </div>
    </footer>
  )
}
