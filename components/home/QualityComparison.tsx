'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useLanguage } from '@/contexts/LanguageContext'
import { getTranslations } from '@/lib/i18n'
import { Sparkles, CheckCircle2, XCircle } from 'lucide-react'

export function QualityComparison() {
  const { language } = useLanguage()
  const t = getTranslations(language)

  return (
    <section className="py-24 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {t.whyChoose.quality.title}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4">
            {t.whyChoose.quality.description}
          </p>
          <p className="text-lg text-primary-600 font-semibold">
            {t.whyChoose.quality.tagline}
          </p>
        </motion.div>

        {/* Comparison Images */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left - Standard AI (Low Quality) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="card bg-red-50 border-red-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-semibold text-red-700">
                    {t.whyChoose.quality.leftLabel}
                  </span>
                </div>
              </div>
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-200 mb-4">
                <Image
                  src="https://picsum.photos/600/600?random=low-quality&blur=2"
                  alt="Low quality AI generation"
                  fill
                  className="object-cover opacity-70"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span>{language === 'en' ? 'Blurry details' : '细节模糊'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span>{language === 'en' ? 'Flat lighting' : '光线平淡'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span>{language === 'en' ? 'Artificial appearance' : '人工痕迹明显'}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right - Gemini AI (High Quality) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="card bg-green-50 border-green-200 relative overflow-hidden">
              <div className="absolute top-4 right-4 z-10">
                <div className="bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>BEST</span>
                </div>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">
                    {t.whyChoose.quality.rightLabel}
                  </span>
                </div>
              </div>
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-200 mb-4">
                <Image
                  src="https://picsum.photos/600/600?random=high-quality"
                  alt="High quality Gemini AI generation"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>{language === 'en' ? 'Crisp details' : '细节清晰'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>{language === 'en' ? 'Natural lighting' : '自然光影'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>{language === 'en' ? 'Photorealistic' : '逼真自然'}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

