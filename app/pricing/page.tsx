import { PricingCard } from '@/components/pricing/PricingCard'
import type { PricingPlan } from '@/types'

// Pricing plans data
const pricingPlans: PricingPlan[] = [
  {
    id: 'basic',
    name: '基础版',
    description: '适合个人和小型项目',
    price: 69,
    credits: 50,
    imageCredits: 50,
    videoCredits: 5,
    features: [
      '每月 50 个图像信用点',
      '每月 5 个视频信用点',
      '标准生成速度',
      '最高 1024×1024 分辨率',
      '访问 Gemini Pro Vision',
      '邮件支持',
    ],
    priority: 'standard',
    maxResolution: '1024×1024',
    advancedModels: false,
  },
  {
    id: 'professional',
    name: '专业版',
    description: '适合创作者和成长型企业',
    price: 99,
    credits: 200,
    imageCredits: 200,
    videoCredits: 20,
    features: [
      '每月 200 个图像信用点',
      '每月 20 个视频信用点',
      '高优先级生成',
      '最高 2048×2048 分辨率',
      '访问所有 Gemini 模型',
      '优先邮件支持',
      '包含商业许可',
    ],
    priority: 'high',
    maxResolution: '2048×2048',
    advancedModels: true,
    popular: true,
  },
  {
    id: 'advanced',
    name: '高级版',
    description: '适合高级用户和代理商',
    price: 139,
    credits: 600,
    imageCredits: 600,
    videoCredits: 60,
    features: [
      '每月 600 个图像信用点',
      '每月 60 个视频信用点',
      '高级优先级生成',
      '最高 4096×4096 分辨率',
      '访问 Gemini Ultra',
      '24/7 优先支持',
      '包含商业许可',
      'API 访问',
      '自定义集成',
    ],
    priority: 'premium',
    maxResolution: '4096×4096',
    advancedModels: true,
  },
  {
    id: 'enterprise',
    name: '企业版',
    description: '为大型组织提供定制解决方案',
    price: 0, // Custom pricing
    credits: 0, // Custom
    imageCredits: 0, // Custom
    videoCredits: 0, // Custom
    features: [
      '无限信用点（定制）',
      '最高优先级生成',
      '最大分辨率支持',
      '访问所有模型 + 测试版功能',
      '专属客户经理',
      'SLA 保证',
      '自定义集成和 API',
      '本地部署选项',
      '培训和入门指导',
    ],
    priority: 'premium',
    maxResolution: 'Custom',
    advancedModels: true,
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-white border-b border-gray-100 py-[120px]">
        <div className="max-w-container mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <h1 className="text-[72px] font-bold text-gray-900 mb-6 leading-[1.1] tracking-[-0.02em]">
            简单透明的定价
          </h1>
          <p className="text-[18px] text-gray-600 max-w-2xl mx-auto mb-8 leading-[1.6]">
            选择适合您需求的方案。所有方案均包含 Google Gemini AI 技术访问权限。
          </p>

          {/* Credit System Explanation */}
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              信用点系统
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-1">图像生成</p>
                <p className="text-2xl font-bold text-primary-600">1 信用点 = 1 张图像</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-1">视频生成</p>
                <p className="text-2xl font-bold text-primary-600">10 信用点 = 1 个视频</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              信用点每月重置。未使用的信用点不会累积到下月。
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-[120px] bg-white">
        <div className="max-w-container mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex flex-wrap justify-center gap-8 items-start">
            {pricingPlans.map((plan, index) => (
              <PricingCard key={plan.id} plan={plan} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-[120px] bg-white border-t border-gray-100">
        <div className="max-w-container mx-auto px-6 sm:px-8 lg:px-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            功能对比
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold text-gray-900">功能</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-900">基础版</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-900">专业版</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-900">高级版</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-900">企业版</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 text-gray-700">生成速度</td>
                  <td className="py-4 px-4 text-center text-gray-600">标准</td>
                  <td className="py-4 px-4 text-center text-primary-600 font-medium">高优先级</td>
                  <td className="py-4 px-4 text-center text-primary-600 font-medium">高级优先级</td>
                  <td className="py-4 px-4 text-center text-primary-600 font-medium">最高优先级</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 text-gray-700">最大分辨率</td>
                  <td className="py-4 px-4 text-center text-gray-600">1024×1024</td>
                  <td className="py-4 px-4 text-center text-gray-600">2048×2048</td>
                  <td className="py-4 px-4 text-center text-gray-600">4096×4096</td>
                  <td className="py-4 px-4 text-center text-gray-600">自定义</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 text-gray-700">高级模型</td>
                  <td className="py-4 px-4 text-center text-gray-400">✗</td>
                  <td className="py-4 px-4 text-center text-green-600">✓</td>
                  <td className="py-4 px-4 text-center text-green-600">✓</td>
                  <td className="py-4 px-4 text-center text-green-600">✓</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 text-gray-700">API 访问</td>
                  <td className="py-4 px-4 text-center text-gray-400">✗</td>
                  <td className="py-4 px-4 text-center text-gray-400">✗</td>
                  <td className="py-4 px-4 text-center text-green-600">✓</td>
                  <td className="py-4 px-4 text-center text-green-600">✓</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 text-gray-700">支持</td>
                  <td className="py-4 px-4 text-center text-gray-600">邮件</td>
                  <td className="py-4 px-4 text-center text-gray-600">优先邮件</td>
                  <td className="py-4 px-4 text-center text-gray-600">24/7 优先支持</td>
                  <td className="py-4 px-4 text-center text-gray-600">专属经理</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 text-gray-700">商业许可</td>
                  <td className="py-4 px-4 text-center text-gray-400">✗</td>
                  <td className="py-4 px-4 text-center text-green-600">✓</td>
                  <td className="py-4 px-4 text-center text-green-600">✓</td>
                  <td className="py-4 px-4 text-center text-green-600">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}

