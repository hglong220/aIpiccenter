'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'
import { getTranslations } from '@/lib/i18n'
import { Shield, Lock, CheckCircle2, Award } from 'lucide-react'

export function SecurityModule() {
  const { language } = useLanguage()
  const t = getTranslations(language)

  const securityFeatures = [
    {
      icon: Shield,
      title: language === 'en' ? 'Google Cloud Security' : 'Google 云安全',
      description: language === 'en' 
        ? 'Enterprise-grade infrastructure with 99.99% uptime SLA'
        : '企业级基础设施，99.99% 正常运行时间 SLA',
    },
    {
      icon: Lock,
      title: language === 'en' ? 'Data Encryption' : '数据加密',
      description: language === 'en'
        ? 'End-to-end encryption for all user data and generated content'
        : '所有用户数据和生成内容的端到端加密',
    },
    {
      icon: CheckCircle2,
      title: language === 'en' ? 'AI Ethics Compliance' : 'AI 道德合规',
      description: language === 'en'
        ? 'Follows Google\'s AI principles for responsible and ethical AI use'
        : '遵循 Google 的 AI 原则，确保负责任和道德的 AI 使用',
    },
    {
      icon: Award,
      title: language === 'en' ? 'Privacy First' : '隐私优先',
      description: language === 'en'
        ? 'Your prompts and creations are never shared with third parties'
        : '您的提示词和作品永远不会与第三方共享',
    },
  ]

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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <Shield className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {t.whyChoose.security.title}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4">
            {t.whyChoose.security.description}
          </p>
          <p className="text-lg text-primary-600 font-semibold">
            {t.whyChoose.security.tagline}
          </p>
        </motion.div>

        {/* Security Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {securityFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="card text-center"
            >
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Google Cloud Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <div className="inline-flex items-center space-x-3 px-6 py-4 bg-white rounded-lg border-2 border-gray-200 shadow-sm">
            <div className="w-10 h-10 bg-blue-500 rounded flex items-center justify-center">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">
                {language === 'en' ? 'Powered by Google Cloud' : '由 Google Cloud 驱动'}
              </p>
              <p className="text-xs text-gray-500">
                {language === 'en' ? 'Enterprise-grade security & reliability' : '企业级安全与可靠性'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

