'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

type ShowcaseCase = {
  id: string
  tag: string
  title: string
  description: string
  image: string
}

const showcaseCases: ShowcaseCase[] = [
  {
    id: 'photography',
    tag: '专业级摄影效果',
    title: '极具光影和景深的产品级渲染图',
    description: '一瓶香水在柔和聚光灯下的超写实特写',
    image:
      'linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.45)), url("https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=80")',
  },
  {
    id: 'art',
    tag: '高定艺术风格探索',
    title: '独特风格化创作',
    description: '一只猫咪的赛博朋克风格肖像',
    image:
      'linear-gradient(180deg, rgba(0,122,255,0.18), rgba(10,10,10,0.55)), url("https://images.unsplash.com/photo-1512686096451-a15c19314f21?auto=format&fit=crop&w=1400&q=80")',
  },
  {
    id: 'design',
    tag: '概念设计快速生成',
    title: '包含精确文字和设计元素的 UI/UX 概念图',
    description: '一个未来汽车仪表盘的设计稿',
    image:
      'linear-gradient(180deg, rgba(0,122,255,0.22), rgba(16,16,20,0.6)), url("https://images.unsplash.com/photo-1618005198919-d3d4b5a92eee?auto=format&fit=crop&w=1400&q=80")',
  },
  {
    id: 'scene',
    tag: '无缝场景编辑与合成',
    title: '复杂的多对象、多背景合成图',
    description: '将一个宇航员放置在中国的长城上，实现场景融合',
    image:
      'linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.6)), url("https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1400&q=80")',
  },
]

export function Showcase() {
  const [activeCase, setActiveCase] = useState<ShowcaseCase | null>(null)
  const gridCases = useMemo(() => showcaseCases, [])

  return (
    <section
      className="bg-[#FAFBFF] py-24 text-[#1A1A1A]"
      style={{ fontFamily: 'Inter, Roboto, "PingFang SC", system-ui, sans-serif' }}
    >
      <div className="main-content-container">
        <div className="content-width-container w-full text-center">
          <h3 className="text-[32px] font-semibold text-[#1A1A1A] md:text-[36px]">
            🌌 无限可能：您的创意，Gemini 实现
          </h3>
          <p className="mt-4 text-base text-[#4A4A4A] md:text-lg">
            兼具摄影级真实感与艺术创意，助力品牌营销、视觉设计和内容生产的全链路。
          </p>

          <div className="mt-16 grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {gridCases.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveCase(item)}
                className="group relative flex h-[340px] flex-col overflow-hidden rounded-[20px] border border-white bg-white shadow-[0_20px_50px_rgba(10,18,36,0.08)] transition-transform duration-500 hover:-translate-y-2 hover:shadow-[0_30px_70px_rgba(10,18,36,0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF] lg:h-[380px] xl:h-[420px]"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: item.image }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/35 to-transparent" />
                <div className="relative z-10 mt-auto flex flex-col gap-3 p-6 text-left text-white">
                  <span className="inline-flex w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]">
                    {item.tag}
                  </span>
                  <h4 className="text-lg font-semibold leading-tight">{item.title}</h4>
                  <p className="text-sm text-white/85">{item.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activeCase && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveCase(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`showcase-${activeCase.id}-title`}
          >
            <motion.div
              className="relative w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/15 bg-[#0B1220] shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 160, damping: 20 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div
                className="relative h-[420px] w-full bg-cover bg-center"
                style={{ backgroundImage: activeCase.image }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/35 to-transparent" />
                <button
                  type="button"
                  onClick={() => setActiveCase(null)}
                  className="absolute right-6 top-6 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-[#1A1A1A] shadow-md transition hover:bg-white"
                  aria-label="关闭预览"
                >
                  关闭
                </button>
              </div>
              <div className="grid gap-6 p-8 text-white md:grid-cols-[2fr_1fr]">
                <div>
                  <h4 id={`showcase-${activeCase.id}-title`} className="text-2xl font-semibold">
                    {activeCase.title}
                  </h4>
                  <p className="mt-3 text-[#C9D7FF]">{activeCase.description}</p>
                </div>
                <div className="space-y-2 rounded-2xl bg-white/5 p-4 text-sm text-[#D2DBFF]">
                  <p className="font-semibold text-white/90">创作亮点</p>
                  <ul className="space-y-2">
                    <li>• 光线与镜头可精准控制</li>
                    <li>• 支持细节级别的对话式修饰</li>
                    <li>• 可导出用于品牌素材或产品设计</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}


