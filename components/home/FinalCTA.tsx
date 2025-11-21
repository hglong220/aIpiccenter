'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { getTranslations } from '@/lib/i18n'
import { ArrowRight, Sparkles } from 'lucide-react'

export function FinalCTA() {
  const { language } = useLanguage()
  const t = getTranslations(language)

  return (
    <section className="py-[120px] bg-white">
      <div className="max-w-container mx-auto w-full px-6 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-6">
            <Sparkles className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-[72px] font-bold text-gray-900 mb-6 leading-[1.1] tracking-[-0.02em]">
            {t.finalCta.title}
          </h2>
          <p className="text-[18px] text-gray-600 max-w-2xl mx-auto mb-12 leading-[1.6]">
            {t.finalCta.description}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/generate"
              className="group bg-[#1A73E8] text-white px-10 py-4 rounded-lg font-semibold text-lg hover:bg-[#155cc0] transition-all duration-200 inline-flex items-center space-x-2"
            >
              <span>{t.finalCta.startCreating}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/pricing"
              className="bg-white border-2 border-[#1A73E8] text-[#1A73E8] px-10 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-all duration-200"
            >
              {t.finalCta.viewPricing}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

