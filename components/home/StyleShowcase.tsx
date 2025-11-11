'use client'

import { motion } from 'framer-motion'

const styleSections = [
  {
    title: '文本渲染',
    subtitle: 'Typography Speaking',
    description: 'Gemini 的图像编辑以全新的准确性渲染文本。',
    images: [
      `https://picsum.photos/seed/text1/1200/1200`,
      `https://picsum.photos/seed/text2/1200/1200`,
      `https://picsum.photos/seed/text3/1200/1200`,
      `https://picsum.photos/seed/text4/1200/1200`,
      `https://picsum.photos/seed/text5/1200/1200`,
      `https://picsum.photos/seed/text6/1200/1200`,
    ],
  },
  {
    title: '获取你的特写',
    subtitle: 'Get Your Macros In',
    images: [
      `https://picsum.photos/seed/macro1/1200/1200`,
      `https://picsum.photos/seed/macro2/1200/1200`,
      `https://picsum.photos/seed/macro3/1200/1200`,
      `https://picsum.photos/seed/macro4/1200/1200`,
      `https://picsum.photos/seed/macro5/1200/1200`,
      `https://picsum.photos/seed/macro6/1200/1200`,
    ],
  },
  {
    title: '任何风格都能实现',
    subtitle: 'Dream in Any Style',
    images: [
      `https://picsum.photos/seed/style1/1200/1200`,
      `https://picsum.photos/seed/style2/1200/1200`,
      `https://picsum.photos/seed/style3/1200/1200`,
      `https://picsum.photos/seed/style4/1200/1200`,
      `https://picsum.photos/seed/style5/1200/1200`,
      `https://picsum.photos/seed/style6/1200/1200`,
    ],
  },
  {
    title: '探索超现实主义',
    subtitle: 'Explore Surreality',
    images: [
      `https://picsum.photos/seed/surreal1/1200/1200`,
      `https://picsum.photos/seed/surreal2/1200/1200`,
      `https://picsum.photos/seed/surreal3/1200/1200`,
      `https://picsum.photos/seed/surreal4/1200/1200`,
      `https://picsum.photos/seed/surreal5/1200/1200`,
      `https://picsum.photos/seed/surreal6/1200/1200`,
    ],
  },
]

export function StyleShowcase() {
  return (
    <>
      {styleSections.map((section, sectionIndex) => (
        <section 
          key={sectionIndex}
          style={{ 
            padding: '120px 0', 
            backgroundColor: sectionIndex % 2 === 0 ? '#FFFFFF' : '#F8F9FA' 
          }}
        >
          <div className="main-content-container">
            <div className="content-width-container">
            <h2 style={{ 
              fontSize: '48px', 
              fontWeight: 600, 
              lineHeight: '1.2', 
              marginBottom: section.description ? '16px' : '60px',
              textAlign: 'center',
              color: '#1c1c1c'
            }}>
              {section.title}
            </h2>
            {section.subtitle && (
              <p style={{ 
                fontSize: '18px', 
                lineHeight: '1.6', 
                color: '#666',
                textAlign: 'center',
                marginBottom: '60px',
                fontStyle: 'italic'
              }}>
                {section.subtitle}
              </p>
            )}
            {section.description && (
              <p style={{ 
                fontSize: '18px', 
                lineHeight: '1.6', 
                color: '#666',
                textAlign: 'center',
                marginBottom: '60px',
                maxWidth: '800px',
                margin: '0 auto 60px'
              }}>
                {section.description}
              </p>
            )}
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '20px'
            }}>
              {section.images.map((image, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  style={{
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
                  <img
                    src={image}
                    alt={`${section.title} ${index + 1}`}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      display: 'block'
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = `https://via.placeholder.com/1200x1200/1A73E8/FFFFFF?text=${encodeURIComponent(section.title)}`
                    }}
                  />
                </motion.div>
              ))}
            </div>
            </div>
          </div>
        </section>
      ))}
    </>
  )
}

