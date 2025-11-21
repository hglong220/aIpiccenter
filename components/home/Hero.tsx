'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles, Image as ImageIcon, Video } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'
import { getTranslations } from '@/lib/i18n'

export function Hero() {
  const { language } = useLanguage()
  const t = getTranslations(language)
  return (
    <section style={{ minHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', paddingTop: '80px', backgroundColor: '#FFFFFF' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <p style={{ color: '#1A73E8', fontWeight: 600, fontSize: '20px', marginBottom: '24px' }}>
          Powered by Google Gemini AI
        </p>
        <h1 style={{ fontSize: '72px', fontWeight: 700, lineHeight: '1.1', marginBottom: '24px', color: '#1c1c1c' }}>
          {language === 'en' ? (
            <>
              Create Stunning{' '}
              <span style={{ color: '#1A73E8' }}>AI Art</span>
              <br />
              in Seconds
            </>
          ) : (
            <>
              秒级创建令人惊叹的<br />
              <span style={{ color: '#1A73E8' }}>AI 视觉艺术</span>
            </>
          )}
        </h1>
        <p style={{ maxWidth: '800px', marginBottom: '40px', fontSize: '20px', lineHeight: '1.6', color: '#1c1c1c', margin: '0 auto 40px' }}>
          {language === 'en' 
            ? 'Enterprise-grade AI image and video generation platform. Transform your ideas into stunning visuals with the power of Google Gemini.'
            : '企业级 AI 图像和视频生成平台。以 Google Gemini 的强大能力，将您的想法转化为震撼人心的视觉效果。'}
        </p>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/generate" className="btn primary">
            {language === 'en' ? 'Start Creating' : '开始创作'}
          </Link>
          <Link href="/pricing" className="btn secondary">
            {language === 'en' ? 'View Pricing' : '查看定价'}
          </Link>
        </div>
      </motion.div>
    </section>
  )
}

