'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'
import Image from 'next/image'

export function FeatureShowcase() {
  const { language } = useLanguage()

  return (
    <>
      {/* Feature 1: Image Generation - Reverse Layout */}
      <section className="feature-section" style={{ backgroundColor: '#F8F9FA', padding: '120px 0' }}>
        <div className="main-content-container" style={{ padding: 0 }}>
          <div className="feature-module reverse">
          <div className="text-content">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p style={{ color: '#1A73E8', fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
                {language === 'en' ? 'Core Feature 1: Image Generation' : '核心功能一：图像生成'}
              </p>
              <h2 style={{ fontSize: '48px', fontWeight: 600, lineHeight: '1.2', marginBottom: '16px', color: '#1c1c1c' }}>
                {language === 'en' ? 'Unleash Imagination, Pixels Come to Life' : '释放想象，像素成真'}
              </h2>
              <p style={{ fontSize: '18px', lineHeight: '1.6', color: '#1c1c1c', marginBottom: '16px' }}>
                {language === 'en'
                  ? 'Gemini AI precisely captures every detail and lighting, transcending traditional limitations. Say goodbye to flat and blurry images, embrace photorealistic visual miracles. Supports 8K ultra-high resolution output.'
                  : 'Gemini AI 精准捕捉每一个细节与光影，超越传统限制。告别扁平与模糊，拥抱栩栩如生的视觉奇迹。支持 8K 级超高分辨率输出。'}
              </p>
              <a
                href="#"
                style={{
                  color: '#1A73E8',
                  fontWeight: 600,
                  marginTop: '16px',
                  display: 'inline-block',
                  textDecoration: 'none',
                  fontSize: '18px',
                }}
              >
                {language === 'en' ? 'View Cases >' : '查看案例 >'}
              </a>
            </motion.div>
          </div>
          <div className="image-content" style={{ overflow: 'hidden', height: '550px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', position: 'relative' }}>
            <Image
              src="https://picsum.photos/1920/1080?random=feature1"
              alt={language === 'en' ? 'Photorealistic Image Generation' : '超现实图像生成'}
              fill
              className="object-cover"
              sizes="50vw"
            />
          </div>
          </div>
        </div>
      </section>

      {/* Feature 2: Video Generation - Normal Layout */}
      <section className="feature-section" style={{ backgroundColor: '#FFFFFF', padding: '120px 0' }}>
        <div className="main-content-container" style={{ padding: 0 }}>
          <div className="feature-module">
          <div className="image-content" style={{ overflow: 'hidden', height: '550px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', position: 'relative' }}>
            <Image
              src="https://picsum.photos/1920/1080?random=feature2"
              alt={language === 'en' ? 'AI Video Generation' : '智能视频生成'}
              fill
              className="object-cover"
              sizes="50vw"
            />
          </div>
          <div className="text-content">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p style={{ color: '#1A73E8', fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
                {language === 'en' ? 'Core Feature 2: Video Generation' : '核心功能二：视频生成'}
              </p>
              <h2 style={{ fontSize: '48px', fontWeight: 600, lineHeight: '1.2', marginBottom: '16px', color: '#1c1c1c' }}>
                {language === 'en' ? 'Dynamic Videos, Instant Creation' : '动态影像，瞬间呈现'}
              </h2>
              <p style={{ fontSize: '18px', lineHeight: '1.6', color: '#1c1c1c', marginBottom: '16px' }}>
                {language === 'en'
                  ? 'Say goodbye to tedious post-production, create engaging video stories with AI. With just a few lines of description, you can generate high-quality, diverse dynamic content.'
                  : '告别繁琐后期，用 AI 创造引人入胜的视频故事。仅需几行描述，即可生成高质量、风格多样的动态内容。'}
              </p>
              <a
                href="#"
                style={{
                  color: '#1A73E8',
                  fontWeight: 600,
                  marginTop: '16px',
                  display: 'inline-block',
                  textDecoration: 'none',
                  fontSize: '18px',
                }}
              >
                {language === 'en' ? 'Learn About Video Generation >' : '了解视频生成 >'}
              </a>
            </motion.div>
          </div>
          </div>
        </div>
      </section>
    </>
  )
}
