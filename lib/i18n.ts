/**
 * Internationalization (i18n) System
 * Supports English (en) and Chinese (zh)
 */

export type Language = 'en' | 'zh'

export interface Translations {
  header: {
    home: string
    generate: string
    pricing: string
    getStarted: string
    goToPricing: string
  }
  hero: {
    poweredBy: string
    mainTitle: string
    subTitle: string
    startCreating: string
    viewPricing: string
    features: {
      imageGeneration: {
        title: string
        description: string
      }
      videoGeneration: {
        title: string
        description: string
      }
      enterpriseReady: {
        title: string
        description: string
      }
    }
  }
  trustBadges: {
    title: string
    description: string
    googleSecurity: {
      title: string
      description: string
    }
    lightningFast: {
      title: string
      description: string
    }
    premiumQuality: {
      title: string
      description: string
    }
    securityNotice: string
  }
  userCases: {
    title: string
    description: string
    createYourOwn: string
  }
  whyChoose: {
    quality: {
      title: string
      description: string
      tagline: string
      leftLabel: string
      rightLabel: string
    }
    efficiency: {
      title: string
      description: string
      tagline: string
    }
    security: {
      title: string
      description: string
      tagline: string
    }
  }
  finalCta: {
    title: string
    description: string
    startCreating: string
    viewPricing: string
  }
}

const translations: Record<Language, Translations> = {
  en: {
    header: {
      home: 'Home',
      generate: 'Generate',
      pricing: 'Pricing',
      getStarted: 'Get Started',
      goToPricing: 'Go to Pricing',
    },
    hero: {
      poweredBy: 'Powered by Google Gemini AI',
      mainTitle: 'Create Stunning AI Art in Seconds',
      subTitle: 'Enterprise-grade AI image and video generation platform. Transform your ideas into breathtaking visuals with the power of Google Gemini.',
      startCreating: 'Start Creating',
      viewPricing: 'View Pricing',
      features: {
        imageGeneration: {
          title: 'AI Image Generation',
          description: 'Create high-quality images from text prompts with advanced AI models.',
        },
        videoGeneration: {
          title: 'AI Video Generation',
          description: 'Generate dynamic videos from descriptions with cutting-edge AI technology.',
        },
        enterpriseReady: {
          title: 'Enterprise Ready',
          description: 'Built for scale with Google-level security, speed, and reliability.',
        },
      },
    },
    trustBadges: {
      title: 'Powered by Google Gemini AI',
      description: 'Experience the power of Google\'s most advanced AI models. Built with enterprise-grade infrastructure for reliability and scale.',
      googleSecurity: {
        title: 'Google Security',
        description: 'Enterprise-grade security powered by Google infrastructure',
      },
      lightningFast: {
        title: 'Lightning Fast',
        description: 'Generate images in seconds with optimized performance',
      },
      premiumQuality: {
        title: 'Premium Quality',
        description: 'Professional-grade outputs that exceed expectations',
      },
      securityNotice: 'Your data is protected by Google-level security',
    },
    userCases: {
      title: 'Latest Creations',
      description: 'See what our users are creating with AI Pic Center. Each piece showcases the power and quality of Google Gemini AI.',
      createYourOwn: 'Create Your Own',
    },
    whyChoose: {
      quality: {
        title: 'Unmatched Quality & Detail',
        description: 'Emphasize Gemini AI\'s exceptional performance in lighting, texture, and complex scenes.',
        tagline: 'Say goodbye to flat and blurry, embrace lifelike visual miracles.',
        leftLabel: 'Standard AI',
        rightLabel: 'Gemini AI',
      },
      efficiency: {
        title: 'Lightning Speed, Infinite Creativity',
        description: 'Highlight Gemini AI\'s ultra-fast generation capabilities and multimodal understanding (can understand complex descriptions).',
        tagline: 'From inspiration to masterpiece, in an instant. Explore your imagination at unprecedented speed.',
      },
      security: {
        title: 'Responsible AI, Peace of Mind',
        description: 'Emphasize that the platform follows Google\'s AI ethics principles and security standards, protecting user privacy and content security.',
        tagline: 'Built on Google\'s powerful security architecture, your data and creations are fully under your control.',
      },
    },
    finalCta: {
      title: 'Ready to Create Something Amazing?',
      description: 'Join thousands of creators using AI Pic Center to bring their ideas to life.',
      startCreating: 'Start Creating',
      viewPricing: 'View Pricing',
    },
  },
  zh: {
    header: {
      home: '首页',
      generate: '生成',
      pricing: '定价',
      getStarted: '立即开始',
      goToPricing: '查看定价',
    },
    hero: {
      poweredBy: '由 Google Gemini AI 驱动',
      mainTitle: '秒级创建令人惊叹的 AI 艺术',
      subTitle: '企业级 AI 图像和视频生成平台。以 Google Gemini 的强大能力，将您的想法转化为震撼人心的视觉效果。',
      startCreating: '开始创作',
      viewPricing: '查看定价',
      features: {
        imageGeneration: {
          title: 'AI 图像生成',
          description: '通过高级格式的文本提示，创建高质量图像。',
        },
        videoGeneration: {
          title: 'AI 视频生成',
          description: '从场景描述到物体定义和设置，生成动态视频。',
        },
        enterpriseReady: {
          title: '企业级就绪',
          description: '基于安全的 Google 云、速度与可靠性构建。',
        },
      },
    },
    trustBadges: {
      title: '由 Google Gemini AI 驱动',
      description: '体验 Google 最先进的 AI 模型的强大能力。采用企业级基础设施构建，确保可靠性和可扩展性。',
      googleSecurity: {
        title: 'Google 安全',
        description: '由 Google 基础设施提供支持的企业级安全',
      },
      lightningFast: {
        title: '闪电般快速',
        description: '通过优化的性能，在几秒钟内生成图像',
      },
      premiumQuality: {
        title: '优质品质',
        description: '超越期望的专业级输出',
      },
      securityNotice: '您的数据受到 Google 级安全保护',
    },
    userCases: {
      title: '最新作品',
      description: '查看我们的用户使用 AI Pic Center 创作的作品。每一件作品都展示了 Google Gemini AI 的强大能力和品质。',
      createYourOwn: '创建您自己的作品',
    },
    whyChoose: {
      quality: {
        title: '超越想象，细节入微',
        description: '强调 Gemini AI 在光影、纹理、复杂场景等方面的卓越表现。',
        tagline: '告别扁平与模糊，拥抱栩栩如生的视觉奇迹。',
        leftLabel: '普通 AI',
        rightLabel: 'Gemini AI',
      },
      efficiency: {
        title: '秒速响应，创意无限',
        description: '突出 Gemini AI 的极速生成能力和多模态理解（能理解复杂描述）。',
        tagline: '从灵感到作品，仅需一瞬。以前所未有的速度，探索你的想象。',
      },
      security: {
        title: '负责任的 AI，安心创作',
        description: '强调网站遵循 Google 的 AI 道德原则和安全标准，保护用户隐私和内容安全。',
        tagline: '基于 Google 强大安全架构，您的数据与创作尽在掌控。',
      },
    },
    finalCta: {
      title: '准备好创造令人惊叹的作品了吗？',
      description: '加入数千名创作者，使用 AI Pic Center 将您的想法变为现实。',
      startCreating: '开始创作',
      viewPricing: '查看定价',
    },
  },
}

export function getTranslations(lang: Language): Translations {
  return translations[lang]
}

export function getText(key: string, lang: Language): string {
  const keys = key.split('.')
  let value: any = translations[lang]
  
  for (const k of keys) {
    value = value?.[k]
    if (value === undefined) return key
  }
  
  return typeof value === 'string' ? value : key
}

