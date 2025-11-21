import Link from 'next/link'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        padding: '20px',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '38px', fontWeight: 700, color: '#1f2937', marginBottom: '12px' }}>404 · 页面不存在</h1>
        <p style={{ fontSize: '16px', color: '#6b7280' }}>该地址不可访问，请返回或关闭此页面。</p>
      </div>
    </div>
  )
}

