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
        backgroundColor: 'transparent',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div className="main-content-container">
        <div className="content-width-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          ></motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          style={{
            width: '100%',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              overflow: 'hidden',
              backgroundColor: '#000',
              pointerEvents: 'none',
              zIndex: 0,
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
                objectFit: 'cover',
                objectPosition: 'center',
              }}
            >
              <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
              {/* 这里的 <img> 是 <video> 的兜底内容，不适合用 next/image，因此精准豁免 no-img-element 规则 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://picsum.photos/1920/1080?random=hero-video"
                alt="AI 产品演示"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </video>
          </div>
        </motion.div>
      </div>
    </section>
  )
}