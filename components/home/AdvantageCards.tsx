'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'
import { Sparkles, Shield, Zap } from 'lucide-react'

export function AdvantageCards() {
  const { language } = useLanguage()

  const advantages = [
    {
      icon: Sparkles,
      title: {
        en: 'Powered by Gemini',
        zh: 'Gemini 驱动',
      },
      description: {
        en: 'Built on Google\'s most advanced AI model, delivering unparalleled creative capabilities and quality.',
        zh: '基于 Google 最先进的 AI 模型构建，提供无与伦比的创作能力和质量。',
      },
    },
    {
      icon: Shield,
      title: {
        en: 'Enterprise-Grade Security',
        zh: '企业级安全',
      },
      description: {
        en: 'Your data and creations are protected by Google Cloud\'s robust security infrastructure, meeting the highest industry standards.',
        zh: '您的数据和创作受到 Google Cloud 强大安全基础设施的保护，符合最高行业标准。',
      },
    },
    {
      icon: Zap,
      title: {
        en: 'Lightning-Fast Performance',
        zh: '极速性能',
      },
      description: {
        en: 'Optimized AI architecture ensures average generation time under 3 seconds, with 99.9% uptime guarantee.',
        zh: '优化的 AI 架构确保平均生成时间小于 3 秒，提供 99.9% 正常运行时间保证。',
      },
    },
  ]

  return (
    <section className="w-full py-[120px] bg-white">
      <div className="max-w-container mx-auto w-full px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[48px]">
          {advantages.map((advantage, index) => {
            const Icon = advantage.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-6">
                  <Icon className="w-8 h-8 text-[#1A73E8]" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {advantage.title[language]}
                </h3>
                <p className="text-[18px] text-gray-600 leading-[1.6]">
                  {advantage.description[language]}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}


