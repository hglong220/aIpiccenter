'use client'

import { motion } from 'framer-motion'

const featureCards = [
  {
    title: '强大的对话式迭代生成',
    description:
      '不再是单次生成。通过自然语言对话，您可以多轮修改和优化图片，保持上下文一致性，实现细致入微的调整，直至完美。',
    icon: '💬',
    accent: 'from-[#EAF2FF] to-white',
  },
  {
    title: '高保真文本渲染',
    description:
      '轻松生成包含清晰、准确、长序列文本的图像（例如海报、徽标）。告别传统 AI 生图中最常见的文字变形和错别字！',
    icon: '🔤',
    accent: 'from-[#F0F4FF] to-white',
  },
  {
    title: '跨模态的深度融合创作',
    description:
      '独有的文生图与文本交织输出能力。让 Gemini 在生成故事、食谱或博客文章的同时，自动配图，实现图文一体化的内容创作。',
    icon: '🔗',
    accent: 'from-[#E8F8FF] to-white',
  },
]

export function KeyFeatures() {
  return (
    <section
      className="bg-white py-24 text-[#1A1A1A]"
      style={{ fontFamily: 'Inter, Roboto, "PingFang SC", system-ui, sans-serif' }}
    >
      <div className="main-content-container">
        <div className="content-width-container flex w-full flex-col items-center text-center">
          <h3 className="text-[32px] font-semibold text-[#1A1A1A] md:text-[36px]">
            🚀 核心优势：您的创意工作站
          </h3>
          <p className="mt-4 max-w-3xl text-base text-[#4A4A4A] md:text-lg">
            针对专业创意团队量身打造：Gemini 让你以对话方式掌控每一个像素，确保文字细节、风格统一与跨模态内容协同。
          </p>

          <div className="mt-16 grid w-full grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
            {featureCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`flex h-full flex-col items-start rounded-[24px] border border-[#E7ECF5] bg-gradient-to-br p-8 text-left shadow-[0_15px_40px_rgba(6,7,9,0.05)] transition-shadow hover:shadow-[0_25px_60px_rgba(6,7,9,0.08)] ${card.accent}`}
              >
                <span className="text-3xl">{card.icon}</span>
                <h4 className="mt-6 text-[22px] font-semibold text-[#1A1A1A]">
                  {card.title}
                </h4>
                <p className="mt-4 text-base leading-relaxed text-[#4A4A4A]">
                  {card.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}


