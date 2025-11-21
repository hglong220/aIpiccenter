'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: '什么是 Nano Banana？',
    answer: 'Nano Banana 是我们来自 Google DeepMind 的顶级 AI 图像生成和图像编辑工具，让你将单张照片转化为无数新创作。在 gemini.google.com 上传你的照片，尽情发挥创意。',
  },
  {
    question: '如何创建更好的图像？',
    answer: `1. 从简单公式开始。尝试 <创建/生成图像> <主体> <动作> <场景>，然后在此基础上构建。例如："创建一只猫在窗台上阳光中打盹的图像。"
2. 尽可能详细地描述。提示词应包含你能想到的所有细节，与其说"创建一个穿红裙子的女人"，不如说"创建一个年轻女人在公园里奔跑，穿着红裙子"。你提供的细节越多，Gemini 就越能遵循你的指令。
3. 考虑构图、风格和图像质量。思考你希望图像中的元素如何排列（构图）、你想要达到的视觉风格（风格）、所需的图像质量水平（图像质量）以及宽高比（尺寸）。
4. 创造力是你的朋友。Gemini 擅长创建超现实对象和独特场景。让你的想象力自由驰骋。
5. 如果你不喜欢看到的结果，只需让 Gemini 改变它。使用我们的图像编辑模型，你可以通过告诉 Gemini 更换背景、替换对象或添加元素来控制你的图像，同时保留你喜欢的细节。`,
  },
  {
    question: '图像生成在我的国家可用吗？',
    answer: 'AI 图像生成在 Gemini 应用可用的所有语言和国家/地区都可用。',
  },
  {
    question: 'Gemini 如何确保安全性？',
    answer: '与我们的 AI 原则一致，这个 AI 图像生成器在设计时考虑了责任。为了确保 Gemini 创建的视觉效果与原始人类艺术作品之间有明确的区别，Gemini 使用不可见的 SynthID 水印以及可见水印来显示它们是 AI 生成的。',
  },
]

export function GeminiFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section style={{ padding: '120px 0', backgroundColor: '#FFFFFF' }}>
      <div className="main-content-container">
        <h2 style={{ 
          fontSize: '48px', 
          fontWeight: 600, 
          lineHeight: '1.2', 
          marginBottom: '60px',
          textAlign: 'center',
          color: '#1c1c1c'
        }}>
          常见问题
        </h2>
        
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {faqs.map((faq, index) => (
            <div
              key={index}
              style={{
                borderBottom: '1px solid #e5e5e5',
                padding: '24px 0',
              }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  textAlign: 'left',
                }}
              >
                <h3 style={{ 
                  fontSize: '20px', 
                  fontWeight: 600,
                  color: '#1c1c1c',
                  margin: 0,
                }}>
                  {faq.question}
                </h3>
                <ChevronDown
                  style={{
                    width: '24px',
                    height: '24px',
                    color: '#666',
                    transform: openIndex === index ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s',
                  }}
                />
              </button>
              {openIndex === index && (
                <div style={{
                  marginTop: '16px',
                  fontSize: '16px',
                  lineHeight: '1.6',
                  color: '#666',
                  whiteSpace: 'pre-line',
                }}>
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}


