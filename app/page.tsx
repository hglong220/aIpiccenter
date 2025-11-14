'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!loading && user) {
      router.replace('/generate')
    }
  }, [loading, user, router])

  useEffect(() => {
    // 确保视频播放
    const video = videoRef.current
    if (!video) return

    const ensurePlaying = () => {
      if (video.paused || video.ended) {
        video.play().catch((error) => {
          console.error('Video play error:', error)
        })
      }
    }

    const handleCanPlay = () => {
      ensurePlaying()
    }

    const handlePause = () => {
      // 如果不是用户手动暂停，自动恢复播放
      if (!video.ended) {
        setTimeout(() => {
          ensurePlaying()
        }, 100)
      }
    }

    const handleWaiting = () => {
      // 视频缓冲时，等待缓冲完成后继续播放
      video.addEventListener('canplay', ensurePlaying, { once: true })
    }

    const handleEnded = () => {
      // 视频结束后重新播放（虽然设置了loop，但确保一下）
      video.currentTime = 0
      video.play().catch((error) => {
        console.error('Video play error:', error)
      })
    }

    // 添加事件监听器
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('stalled', ensurePlaying)

    // 如果视频已经可以播放，直接播放
    if (video.readyState >= 3) {
      ensurePlaying()
    }

    // 定期检查视频是否在播放
    const checkInterval = setInterval(() => {
      if (video.paused && !video.ended) {
        ensurePlaying()
      }
    }, 2000)

    return () => {
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('stalled', ensurePlaying)
      clearInterval(checkInterval)
    }
  }, [])

  if (!loading && user) {
    return null
  }

  return (
    <>
      {/* 视频背景 */}
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
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
          onLoadedData={() => {
            if (videoRef.current) {
              videoRef.current.play().catch((error) => {
                console.error('Video play error:', error)
              })
            }
          }}
          onError={(e) => {
            console.error('Video error:', e)
          }}
        >
          <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
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
      
      {/* 内容层 */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Header />
        <Footer />
      </div>
    </>
  )
}
