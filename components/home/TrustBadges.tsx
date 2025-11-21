'use client'

import { Shield, Zap, Award, Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'
import { getTranslations } from '@/lib/i18n'

export function TrustBadges() {
  const { language } = useLanguage()
  const t = getTranslations(language)

  const trustPoints = [
    {
      icon: Shield,
      title: t.trustBadges.googleSecurity.title,
      description: t.trustBadges.googleSecurity.description,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: Zap,
      title: t.trustBadges.lightningFast.title,
      description: t.trustBadges.lightningFast.description,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      icon: Award,
      title: t.trustBadges.premiumQuality.title,
      description: t.trustBadges.premiumQuality.description,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
  ]
  return (
    <section className="py-24 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {language === 'en' ? (
                <>
                  Powered by <span className="text-primary-600">Google Gemini AI</span>
                </>
              ) : (
                <>
                  由 <span className="text-primary-600">Google Gemini AI</span> 驱动
                </>
              )}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t.trustBadges.description}
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {trustPoints.map((point, index) => (
            <motion.div
              key={point.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center"
            >
              <div className={`w-16 h-16 ${point.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <point.icon className={`w-8 h-8 ${point.color}`} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{point.title}</h3>
              <p className="text-gray-600">{point.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Security Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-50 rounded-lg border border-gray-200">
            <Lock className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700">
              {t.trustBadges.securityNotice}
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

