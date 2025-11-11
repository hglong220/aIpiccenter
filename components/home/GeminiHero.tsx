'use client'

import { motion } from 'framer-motion'

export function GeminiHero() {
  return (
    <section
      style={{
        minHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        paddingTop: '40px',
        paddingBottom: '10px',
        backgroundColor: '#FFFFFF',
      }}
    >
      <div className="main-content-container">
        <div className="content-width-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
          </motion.div>
        </div>
        
        {/* AI 产品演示视频 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          style={{
            width: '100%',
            marginBottom: '12px'
          }}
        >
          <div
            style={{
              width: '100%',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              backgroundColor: '#000',
              height: 'min(150vh, 1500px)',
            }}
          >
            <video
              autoPlay
              loop
              muted
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            >
              <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
              {/* 备用图片 */}
              <img 
                src="https://picsum.photos/1920/1080?random=hero-video" 
                alt="AI 产品演示"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </video>
          </div>
        </motion.div>
        
      </div>
    </section>
  )
}