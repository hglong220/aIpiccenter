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
        backgroundColor: '#FFFFFF',
        marginTop: 'auto',
      }}
    >
      {/* Full width border */}
      <div
        style={{
          width: '100%',
          height: '1px',
          backgroundColor: '#e5e5e5',
        }}
      ></div>

      <div
        className="main-content-container"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60px',
          paddingTop: '20px',
          paddingBottom: '20px',
        }}
      >
        {/* Single line content */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '24px',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              color: '#888888',
              letterSpacing: '0.01em',
              fontWeight: 400,
            }}
          >
            © {currentYear} AI Pic Center. All rights reserved.
          </span>
          <Link
            href="/privacy"
            className="transition hover:text-[#007AFF]"
            style={{
              fontSize: '12px',
              color: '#888888',
              textDecoration: 'none',
            }}
          >
            隐私政策
          </Link>
          <Link
            href="/terms"
            className="transition hover:text-[#007AFF]"
            style={{
              fontSize: '12px',
              color: '#888888',
              textDecoration: 'none',
            }}
          >
            服务条款
          </Link>
          <Link
            href="/contact"
            className="transition hover:text-[#007AFF]"
            style={{
              fontSize: '12px',
              color: '#888888',
              textDecoration: 'none',
            }}
          >
            联系我们
          </Link>
        </div>
      </div>
    </footer>
  )
}
