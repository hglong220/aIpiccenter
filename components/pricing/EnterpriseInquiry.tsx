'use client'

import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import type { EnterpriseInquiry } from '@/types'

export function EnterpriseInquiry() {
  const [formData, setFormData] = useState<EnterpriseInquiry>({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    requirements: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      
      toast.success('询价提交成功！我们会尽快与您联系。')
      setFormData({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        requirements: '',
      })
    } catch (error) {
      toast.error('提交询价失败，请重试。')
      console.error('Error submitting inquiry:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <section id="enterprise-inquiry" className="py-16 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            企业询价
          </h2>
          <p className="text-lg text-gray-600">
            需要定制解决方案？联系我们的销售团队获取企业定价和专属支持。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-6">
          {/* Company Name */}
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
              公司名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              required
              value={formData.companyName}
              onChange={handleChange}
              className="input-primary"
              placeholder="您的公司名称"
            />
          </div>

          {/* Contact Name */}
          <div>
            <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-2">
              联系人姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="contactName"
              name="contactName"
              required
              value={formData.contactName}
              onChange={handleChange}
              className="input-primary"
              placeholder="您的全名"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              电子邮箱 <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="input-primary"
              placeholder="your.email@company.com"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              电话号码
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input-primary"
              placeholder="+86 138 0000 0000"
            />
          </div>

          {/* Requirements */}
          <div>
            <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-2">
              具体需求 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="requirements"
              name="requirements"
              required
              rows={5}
              value={formData.requirements}
              onChange={handleChange}
              className="input-primary resize-none"
              placeholder="请描述您的具体需求、预期使用量、集成要求等。"
            />
          </div>

          {/* Security Notice */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg
                className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  您的数据安全
                </p>
                <p className="text-xs text-gray-700">
                  所有信息均经过加密，并受到 Google 级安全标准保护。
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-primary py-3 inline-flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>提交中...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>提交询价</span>
              </>
            )}
          </button>
        </form>
      </div>
    </section>
  )
}

