'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

const trendingCases = [
  {
    id: 1,
    title: '我和谁？',
    description: '用 Gemini 在自拍中添加任何内容。凭借更好的图像创建和编辑功能，几乎没有什么是不可能的。',
    image: `https://picsum.photos/seed/trend1/1200/1200`,
    prompt: '在自拍中添加任何内容',
  },
  {
    id: 2,
    title: '2 合 1？轻松完成',
    description: 'Gemini 现在允许你上传两张图片并将它们合并成一张图像。',
    image: `https://picsum.photos/seed/trend2/1200/1200`,
    prompt: '合并两张图片',
  },
  {
    id: 3,
    title: '从照片到手办风格',
    description: '只需一个提示词，就能将你最喜欢的照片转换为定制迷你手办风格的图像，这要归功于 Gemini 中的 Nano Banana。',
    image: `https://picsum.photos/seed/trend3/1200/1200`,
    prompt: '转换为手办风格',
  },
  {
    id: 4,
    title: '准备改头换面？',
    description: '试试 90 年代垃圾摇滚、80 年代预科生风格等等，使用 Gemini 的图像创建和编辑新更新。',
    image: `https://picsum.photos/seed/trend4/1200/1200`,
    prompt: '90 年代风格改造',
  },
  {
    id: 5,
    title: '系好安全带，我们来做商场照片',
    description: '上传一张照片到 Gemini 并提示："将其转换为复古风格的商场工作室肖像。"',
    image: `https://picsum.photos/seed/trend5/1200/1200`,
    prompt: '复古商场肖像',
  },
  {
    id: 6,
    title: '先试试发型',
    description: '稍后感谢自己。通过最新的图像更新，你可以瞬间尝试任何发型。',
    image: `https://picsum.photos/seed/trend6/1200/1200`,
    prompt: '尝试新发型',
  },
]

export function TrendingNow() {
  return (
    <section style={{ padding: '120px 0', backgroundColor: '#F8F9FA' }}>
      <div className="main-content-container">
        <div className="content-width-container">
        <h2 style={{ 
          fontSize: '48px', 
          fontWeight: 600, 
          lineHeight: '1.2', 
          marginBottom: '20px',
          textAlign: 'center',
          color: '#1c1c1c'
        }}>
          热门趋势：<span style={{ color: '#1A73E8' }}>Nano Banana</span>
        </h2>
        <p style={{ 
          fontSize: '18px', 
          lineHeight: '1.6', 
          color: '#666',
          textAlign: 'center',
          marginBottom: '60px',
          maxWidth: '800px',
          margin: '0 auto 60px'
        }}>
          看看人们如何使用 Gemini 中的 Nano Banana 来重新想象他们的照片。
        </p>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '20px'
        }}>
          {trendingCases.map((case_, index) => (
            <motion.div
              key={case_.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ 
                position: 'relative', 
                width: '100%', 
                aspectRatio: '1 / 1',
                minHeight: '377px',
                borderRadius: '16px', 
                overflow: 'hidden',
                boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                backgroundColor: '#f0f0f0'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)'
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.15)'
              }}
              >
                <Image
                  src={case_.image}
                  alt={case_.title}
                  fill
                  style={{ 
                    objectFit: 'cover',
                    display: 'block'
                  }}
                  onError={(e) => {
                    const target = e.currentTarget
                    target.src = `https://via.placeholder.com/1200x1200/1A73E8/FFFFFF?text=${encodeURIComponent(case_.title)}`
                  }}
                />
              </div>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: 600, 
                marginBottom: '8px',
                color: '#1c1c1c'
              }}>
                {case_.title}
              </h3>
              <p style={{ 
                fontSize: '16px', 
                lineHeight: '1.5', 
                color: '#666',
                marginBottom: '8px'
              }}>
                {case_.description}
              </p>
              <p style={{ 
                fontSize: '14px', 
                color: '#1A73E8',
                fontWeight: 500
              }}>
                提示词：{case_.prompt}
              </p>
            </motion.div>
          ))}
        </div>
        </div>
      </div>
    </section>
  )
}

