# AI Pic Center

Enterprise AI Image & Video Generation Platform powered by Google Gemini

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

- 复制 `env.template` 为 `.env.local`，按注释填写实际值。
- 最基本需要配置：
  - `GOOGLE_GEMINI_API_KEY`（文本/聊天）
  - `NEXT_PUBLIC_GEMINI_API_KEY`（前端使用，可与上面相同）
  - `NEXT_PUBLIC_APP_URL`（网站地址）
- 可选扩展模型（调度器会自动识别）包括：
  - `CLAUDE_API_KEY`（Anthropic Claude）
  - `QWEN_API_KEY`（通义千问）
  - `MIDJOURNEY_API_KEY`（Midjourney 网关）
  - `WANXIANG_API_KEY`（通义万相）
  - `RUNWAY_API_KEY` / `PIKA_API_KEY` / `KLING_API_KEY` / `SORA_API_KEY`（视频生成）

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   ├── generate/          # Image generation page
│   ├── pricing/           # Pricing page
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── layout/           # Layout components
│   └── features/         # Feature-specific components
├── lib/                   # Utilities and helpers
│   ├── gemini.ts         # Gemini API integration
│   └── store.ts          # State management
└── types/                 # TypeScript types
```

## 🎯 Features

- ✅ AI Image Generation with Gemini
- ✅ AI Video Generation (API ready)
- ✅ Real-time generation status
- ✅ Progressive result loading
- ✅ Responsive design
- ✅ Accessibility (WCAG compliant)
- ✅ Performance optimized (Core Web Vitals)

## 🔒 Security

All API keys are stored server-side. Client-side code never exposes sensitive credentials.

## 📝 License

Proprietary - All rights reserved


