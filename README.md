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

Create a `.env.local` file:

```env
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

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


