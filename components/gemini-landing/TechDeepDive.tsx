'use client'

import { motion } from 'framer-motion'

const highlights = [
  {
    title: '🌟 多模态推理',
    description:
      '利用 Gemini 的世界知识和推理能力生成图片，确保画面元素之间逻辑一致、故事线合理。',
    emphasis: '多模态推理',
  },
  {
    title: '🔄 多图到图 (合成/风格迁移)',
    description:
      '支持上传多张图片进行场景合成或风格迁移，轻松完成复杂的视觉整合与替换任务。',
    emphasis: '多图到图',
  },
  {
    title: '⚙️ 高级控制修饰符',
    description:
      '通过提示词精确控制光线、镜头、相机设置，达到摄影级的细节控制，呈现真实质感。',
    emphasis: '高级控制修饰符',
  },
]

export function TechDeepDive() {
  return (
    <section
      className="bg-white py-24 text-[#1A1A1A]"
      style={{ fontFamily: 'Inter, Roboto, "PingFang SC", system-ui, sans-serif' }}
    >
      <div className="main-content-container">
        <div className="content-width-container grid w-full gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-center">
          <div className="space-y-6">
            <h3 className="text-[32px] font-semibold text-[#1A1A1A] md:text-[36px]">
              🛠️ Gemini 的智慧核心：超越一般图像生成
            </h3>
            <p className="text-base text-[#4A4A4A] md:text-lg">
              从动态图像理解到细节级控制，Gemini 通过深度多模态架构为创作者提供全新的创作方式。
            </p>
            <div className="relative mt-10 overflow-hidden rounded-[28px] border border-[#E7ECF5] bg-[#F8FAFF] p-10 shadow-[0_20px_60px_rgba(10,18,36,0.08)]">
              <div className="absolute inset-y-0 left-0 w-[4px] bg-[#007AFF]" />
              <p className="text-[15px] uppercase tracking-[0.28em] text-[#007AFF]">Prompt Workflow</p>
              <h4 className="mt-4 text-2xl font-semibold text-[#1A1A1A]">
                「冷调影棚摄影，强调玻璃折射 + 细雾效果」
              </h4>
              <p className="mt-3 text-sm text-[#4A4A4A]">
                Gemini 自动解析场景、光线、材质与文字排版要求，并提供语义一致的视觉输出。
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4A4A4A]">
                    指令拆解
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-[#1A1A1A]">
                    <li>• 识别「冷调影棚」→ 调整色温与光比</li>
                    <li>• 解析「玻璃折射」→ 增强高光与折射路径</li>
                    <li>• 应用「细雾效果」→ 控制氛围光散射</li>
                  </ul>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4A4A4A]">
                    输出控制
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-[#1A1A1A]">
                    <li>• 以对话继续微调镜头焦距</li>
                    <li>• 自适应保留文字元素的清晰度</li>
                    <li>• 可导出 PSD/图层结构用于后期</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 rounded-[28px] border border-[#E7ECF5] bg-[#F9FBFF] p-8 shadow-[0_20px_60px_rgba(10,18,36,0.06)]">
            <ul className="space-y-6 text-left text-[#1A1A1A]">
              {highlights.map((item, index) => (
                <motion.li
                  key={item.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="rounded-2xl bg-white p-6 shadow-sm"
                >
                  <h5 className="text-lg font-semibold">{item.title}</h5>
                  <p className="mt-3 text-sm leading-relaxed text-[#4A4A4A]">
                    <strong className="font-semibold text-[#1A1A1A]">{item.emphasis}</strong>
                    {`：${item.description.replace(item.emphasis, '').trim()}`}
                  </p>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}


