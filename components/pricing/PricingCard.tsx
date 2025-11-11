'use client'

import { Check, Zap, Crown, Building2 } from 'lucide-react'
import Link from 'next/link'
import type { PricingPlan } from '@/types'
import { motion } from 'framer-motion'

interface PricingCardProps {
  plan: PricingPlan
  index: number
}

const iconMap = {
  basic: Zap,
  professional: Crown,
  enterprise: Building2,
}

export function PricingCard({ plan, index }: PricingCardProps) {
  const Icon = iconMap[plan.id as keyof typeof iconMap] || Zap

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className={`bg-white rounded-xl border border-gray-200 p-6 relative flex flex-col w-[300px] ${plan.popular ? 'ring-2 ring-[#1A73E8]' : ''}`}
      style={{ display: 'flex', flexDirection: 'column', minHeight: '750px', overflow: 'visible' }}
    >
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-xs font-semibold">
            最受欢迎
          </span>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
        <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
        <div className="mb-4">
          {plan.price === 0 ? (
            <span className="text-2xl font-bold text-gray-900">定制价格</span>
          ) : (
            <>
              <span className="text-4xl font-bold text-gray-900">¥{plan.price}</span>
              <span className="text-gray-600">/月</span>
            </>
          )}
        </div>
      </div>

      {/* Credits Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">图像信用点</span>
          <span className="text-lg font-semibold text-gray-900">
            {plan.imageCredits === 0 ? '无限' : plan.imageCredits}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">视频信用点</span>
          <span className="text-lg font-semibold text-gray-900">
            {plan.videoCredits === 0 ? '无限' : plan.videoCredits}
          </span>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
          <p>1 信用点 = 1 张图像</p>
          <p>10 信用点 = 1 个视频</p>
        </div>
      </div>

      {/* Features - Flex grow to push button to bottom */}
      <ul className="space-y-3 mb-6 flex-grow" style={{ flexGrow: 1 }}>
        {plan.features.map((feature, idx) => (
          <li key={idx} className="flex items-start space-x-2">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button - Always at bottom */}
      <div 
        className="pt-4 pb-2" 
        style={{ 
          marginTop: 'auto', 
          paddingTop: plan.id === 'basic' ? '121px' : plan.id === 'professional' ? '83px' : plan.id === 'enterprise' ? '24px' : '16px', // 基础版下移2.8厘米，专业版下移1.8厘米，企业版下移0.2厘米（8px + 16px = 24px）
          paddingBottom: '8px'
        }}
      >
        {plan.id === 'enterprise' ? (
          <Link
            href="/pricing#enterprise-inquiry"
            className="block w-full btn-secondary text-center"
          >
            联系销售
          </Link>
        ) : (
          <Link
            href={`/payment?planId=${plan.id}&planName=${encodeURIComponent(plan.name)}&price=${plan.price}&credits=${plan.credits}`}
            className="block w-full btn-primary text-center"
          >
            开始使用
          </Link>
        )}
      </div>
    </motion.div>
  )
}

