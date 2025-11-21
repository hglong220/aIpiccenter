'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'
import { getTranslations } from '@/lib/i18n'
import { Zap, Sparkles } from 'lucide-react'

export function EfficiencyShowcase() {
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-6">
            <Zap className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {t.whyChoose.efficiency.title}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4">
            {t.whyChoose.efficiency.description}
          </p>
          <p className="text-lg text-primary-600 font-semibold">
            {t.whyChoose.efficiency.tagline}
          </p>
        </motion.div>

        {/* Video Player - Real Video Embed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-5xl mx-auto"
        >
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              poster="https://picsum.photos/1920/1080?random=video-poster"
            >
              <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
              {/* Fallback for browsers that don't support video */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800">
                <div className="text-center text-white">
                  <Zap className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-xl font-semibold">
                    {language === 'en' ? 'Video Preview' : '视频预览'}
                  </p>
                </div>
              </div>
            </video>
            {/* Overlay with prompt simulation */}
            <div className="absolute top-4 left-4 right-4">
              <div className="bg-black/70 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-white font-medium">
                    {language === 'en' ? 'Prompt:' : '提示词：'}
                  </span>
                </div>
                <p className="text-white text-sm font-mono">
                  {language === 'en' 
                    ? 'A majestic lion standing on a cliff at sunset, cinematic lighting, 4k, highly detailed'
                    : '一只雄伟的狮子站在悬崖上，夕阳西下，电影级光影，4k，高度细节'}
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">&lt; 3s</div>
              <div className="text-gray-600">
                {language === 'en' ? 'Average Generation Time' : '平均生成时间'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">99.9%</div>
              <div className="text-gray-600">
                {language === 'en' ? 'Uptime Guarantee' : '正常运行保证'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">24/7</div>
              <div className="text-gray-600">
                {language === 'en' ? 'Available Support' : '全天候支持'}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

