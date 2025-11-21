'use client'

import Link from 'next/link'

export function FinalCTA() {
  return (
    <section
      className="bg-white pb-16 pt-12 text-center text-[#1A1A1A]"
      style={{ fontFamily: 'Inter, Roboto, "PingFang SC", system-ui, sans-serif' }}
    >
      <div className="main-content-container">
        <div className="content-width-container">
          <div className="mx-auto flex w-full max-w-[960px] flex-col items-center gap-8 px-8" style={{ paddingTop: 'calc(4rem - 0.5cm)', paddingBottom: '4rem' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-[#1A73E8] rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.934 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732L9.854 7.2l1.179-4.456A1 1 0 0112 2z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-[32px] font-bold text-[#1c1c1c] md:text-[36px]">
                AI Pic <span className="text-[#1A73E8]">Center</span>
              </span>
            </div>
            <p className="max-w-2xl text-lg text-[#666] md:text-xl text-center leading-relaxed">
              由 Google Gemini 驱动的企业级 AI 图像和视频生成平台。以专业级质量和速度，创造令人惊叹的视觉效果。
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}