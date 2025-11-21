'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

const DEMO_ITEMS = [
  {
    prompt: 'AI数字艺术：赛博朋克风格机器人战士，霓虹色彩与金属质感',
    image:
      'linear-gradient(135deg, rgba(0,122,255,0.2), rgba(10,10,10,0.6)), url("https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=2400&q=95")',
  },
  {
    prompt: '超现实主义风景：漂浮在天空中的彩色山脉与水晶结构',
    image:
      'linear-gradient(135deg, rgba(0,122,255,0.25), rgba(26,26,26,0.5)), url("https://images.unsplash.com/photo-1614850715649-1d0106293bd1?auto=format&fit=crop&w=2400&q=95")',
  },
  {
    prompt: 'AI生成概念艺术：未来城市与发光的能量球体，科幻风格',
    image:
      'linear-gradient(135deg, rgba(0,122,255,0.18), rgba(26,26,26,0.55)), url("https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=2400&q=95")',
  },
  {
    prompt: '数字艺术作品：抽象的几何形状与流动的光线，梦幻色彩',
    image:
      'linear-gradient(135deg, rgba(0,122,255,0.3), rgba(26,26,26,0.6)), url("https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=2400&q=95")',
  },
  {
    prompt: 'AI创作幻想作品：发光的水晶生物与电子电路的融合',
    image:
      'linear-gradient(135deg, rgba(0,122,255,0.22), rgba(26,26,26,0.5)), url("https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=2400&q=95")',
  },
  {
    prompt: '超现实数字艺术：彩虹色的分形图案与光效粒子',
    image:
      'linear-gradient(135deg, rgba(0,122,255,0.28), rgba(26,26,26,0.65)), url("https://images.unsplash.com/photo-1617791160588-241658c0f566?auto=format&fit=crop&w=2400&q=95")',
  },
]

export function Hero() {
  const [activeIndex, setActiveIndex] = useState(0)

  const items = useMemo(() => DEMO_ITEMS, [])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length)
    }, 3500)

    return () => {
      window.clearInterval(interval)
    }
  }, [items.length])

  const activeItem = items[activeIndex]

  return (
    <section
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white pt-10 pb-24 text-[#1A1A1A] lg:-mt-32"
      style={{ fontFamily: 'Inter, Roboto, \"PingFang SC\", system-ui, sans-serif' }}
    >
      <div className="main-content-container">
        <div className="content-width-container mx-auto flex w-full flex-col items-center gap-14 text-center lg:gap-20 px-8 lg:px-16">
          <div className="flex flex-col items-center gap-10">
            <p className="inline-flex w-fit items-center rounded-full bg-[#F2F6FF] px-5 py-2.5 text-lg font-semibold text-[#007AFF] shadow-sm">
              Gemini Image Generation
            </p>
            <h1 className="w-full font-bold leading-[1.2] tracking-[0.05em] text-[#1A1A1A] text-center whitespace-nowrap" style={{ fontSize: 'clamp(3rem, 7vw, 6rem)', maxWidth: '100%', marginTop: '3cm', overflow: 'visible' }}>
              Gemini 生图：释放无限创意，从文本到视觉的飞跃
            </h1>
            <p className="max-w-[960px] text-balance text-[24px] leading-[1.78] text-[#3A3A3A] text-center">
              利用 Gemini 强大的多模态理解和推理能力，轻松创作出令人惊叹的高质量图像。无论是视觉海报、品牌设计还是沉浸式故事场景，都能以对话式方式持续优化，直至完美呈现。
            </p>
            <div className="flex flex-col items-center justify-center gap-6">
              <Link
                href="/generate/workspace"
                className="rounded-full bg-[#007AFF] px-12 py-4 text-[22px] font-semibold text-white shadow-lg shadow-blue-200 transition-transform duration-300 hover:-translate-y-0.5 hover:bg-[#0060D6]"
              >
                立即体验
              </Link>
              <span className="text-[18px] font-medium tracking-[0.18em] text-[#4A4A4A]">
                无需培训 · 支持中文/英文输入 · 兼容多平台工作流
              </span>
            </div>
          </div>
          <div className="relative h-[1034px] w-full overflow-hidden rounded-[28px] border border-[#E6EAF5] bg-[#F8FAFF] shadow-[0_30px_70px_rgba(0,0,0,0.08)] md:h-[1094px]">
            <div className="absolute inset-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, filter: 'blur(12px)', scale: 1.01 }}
                  animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
                  exit={{ opacity: 0, filter: 'blur(10px)', scale: 0.99 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="absolute inset-0"
                  style={{
                    backgroundImage: activeItem.image,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              </AnimatePresence>
            </div>

            <div className="relative z-10 flex h-full flex-col justify-between p-9">
              <div className="flex w-full max-w-[340px] flex-col gap-3 rounded-2xl bg-white/85 p-6 shadow-lg backdrop-blur">
                <span className="text-xs uppercase tracking-[0.26em] text-[#007AFF]">Prompt</span>
                <p className="text-base font-medium leading-relaxed text-[#1A1A1A]">
                  {activeItem.prompt}
                </p>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.32em] text-white/80">
                    Gemini Output
                  </p>
                  <p className="mt-2 text-xs text-white/70">
                    高保真的细节控制、文字排版与多模态理解能力完美结合
                  </p>
                </div>
                <div className="rounded-full bg-white/75 px-4 py-2 text-xs font-semibold text-[#007AFF] shadow-md backdrop-blur">
                  AI Rendering
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute inset-0 rounded-[28px] border border-white/20" />
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-[-200px] h-[360px] bg-gradient-to-t from-[#E6F0FF] via-transparent to-transparent" />
    </section>
  )
}


