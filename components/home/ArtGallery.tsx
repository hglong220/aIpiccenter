'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'
import Image from 'next/image'

export function ArtGallery() {
  const { language } = useLanguage()

  const galleryImages = [
    { id: 1, src: 'https://picsum.photos/400/400?random=art1' },
    { id: 2, src: 'https://picsum.photos/400/400?random=art2' },
    { id: 3, src: 'https://picsum.photos/400/400?random=art3' },
    { id: 4, src: 'https://picsum.photos/400/400?random=art4' },
  ]

  return (
    <section style={{ padding: '120px 0', backgroundColor: '#FFFFFF' }}>
      <div className="main-content-container">
        <h2 style={{ textAlign: 'center', marginBottom: '60px', fontSize: '48px', fontWeight: 600, color: '#1c1c1c' }}>
          {language === 'en' ? 'Explore Our AI Art Gallery' : '探索我们的 AI 艺术画廊'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          {galleryImages.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden' }}
            >
              <Image
                src={image.src}
                alt={`AI Art ${image.id}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}


