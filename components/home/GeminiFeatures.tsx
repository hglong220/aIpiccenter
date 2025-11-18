'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

const features = [
  {
    id: 1,
    title: '组合你的照片',
    description: '你可以上传多张照片来组合元素，并将它们混合在同一场景中。',
    image: `https://picsum.photos/seed/combine/800/800`,
  },
  {
    id: 2,
    title: '置身任何场景',
    description: '将自己传送到不同的地方、服装、发型，甚至不同的年代。',
    image: `https://picsum.photos/seed/anywhere/800/800`,
  },
  {
    id: 3,
    title: '重新混合照片',
    description: '将一个对象的风格、颜色或纹理转移到另一个对象上。',
    image: `https://picsum.photos/seed/remix/800/800`,
  },
  {
    id: 4,
    title: '进行特定编辑',
    description: '只需用文字即可轻松编辑照片中的特定元素。恢复照片、更换背景、替换主体等等。',
    image: `https://picsum.photos/seed/edit/800/800`,
  },
  {
    id: 5,
    title: 'AI 智能增强',
    description: '利用 Gemini AI 的强大能力，自动优化图像质量、色彩和细节。',
    image: `https://picsum.photos/seed/enhance/800/800`,
  },
  {
    id: 6,
    title: '批量处理',
    description: '一次性处理多张图片，提高工作效率，节省宝贵时间。',
    image: `https://picsum.photos/seed/batch/800/800`,
  },
]

export function GeminiFeatures() {
  return (
    <section style={{ padding: '120px 0', backgroundColor: '#FFFFFF' }}>
      <div className="main-content-container">
        <h2 style={{ 
          fontSize: '48px', 
          fontWeight: 600, 
          lineHeight: '1.2', 
          marginBottom: '60px', 
          textAlign: 'center',
          color: '#1c1c1c'
        }}>
          Gemini 图像编辑 <span style={{ color: '#1A73E8' }}>功能强大</span>
        </h2>
        
        <div className="content-width-container" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '20px',
          marginBottom: '80px'
        }}>
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
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
                  src={feature.image}
                  alt={feature.title}
                  fill
                  style={{ 
                    objectFit: 'cover',
                    display: 'block'
                  }}
                  onError={(e) => {
                    const target = e.currentTarget
                    target.src = `https://via.placeholder.com/800x800/1A73E8/FFFFFF?text=${encodeURIComponent(feature.title)}`
                  }}
                />
              </div>
              <h3 style={{ 
                fontSize: '28px', 
                fontWeight: 600, 
                marginBottom: '12px',
                color: '#1c1c1c'
              }}>
                {feature.title}
              </h3>
              <p style={{ 
                fontSize: '20px', 
                lineHeight: '1.6', 
                color: '#666',
              }}>
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
