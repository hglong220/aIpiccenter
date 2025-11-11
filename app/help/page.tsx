'use client'

import { useMemo, useState } from 'react'

const CONTAINER_STYLE: React.CSSProperties = { maxWidth: '1400px', margin: '0 auto', padding: '0 72px' }
const SECTION_TITLE: React.CSSProperties = { fontSize: '32px', fontWeight: 700, color: '#101225', marginBottom: '20px' }
const SECTION_TEXT: React.CSSProperties = { fontSize: '18px', lineHeight: 1.7, color: '#4B5369', maxWidth: '840px' }

const CATEGORIES = [
  {
    title: '快速上手与界面指南',
    icon: '🚀',
    description: '注册、登录、熟悉 AI 工作台界面，以及完成第一个生成任务的详尽步骤。',
    link: '#getting-started',
  },
  {
    title: '提示词与创意技巧',
    icon: '💡',
    description: '掌握 Prompt 编写技巧，学习镜头、光线、风格控制方法，释放 Gemini 的全部潜力。',
    link: '#prompt-academy',
  },
  {
    title: '账户、计费与用量',
    icon: '💰',
    description: '了解订阅计划、积分使用规则、发票与用量管理，确保团队预算透明。',
    link: '#billing',
  },
  {
    title: '安全、版权与政策',
    icon: '🛡️',
    description: '明确版权归属、内容安全策略与责任 AI 原则，让创作更安心。',
    link: '#policy',
  },
]

const PROMPT_ACADEMY = [
  {
    category: '图像生成：光影与风格控制',
    sections: [
      {
        title: '解锁摄影级光影控制',
        description:
          '图像的质量取决于光线。使用“伦勃朗光”、“环境光”或“戏剧性聚光”等专业词汇，精准引导 Imagen 引擎营造氛围。',
        example: '一只黑豹在雨中奔跑，使用低角度逆光，背景有霓虹灯晕染，电影级颗粒感。',
      },
      {
        title: '掌握构图与镜头语言',
        description:
          '善用广角、微距、鱼眼镜头与景深（DOF）描述，让画面更具故事性。结合“低角度”、“肩部视角”等视点，塑造画面张力。',
        example: '一架老式飞机在山谷中飞行，全景广角，浅景深虚化背景，8K 超写实。',
      },
      {
        title: '高保真文本的秘诀',
        description:
          '确保希望渲染的文字清晰可读。使用双引号强调文字内容，并加入“清晰可读的排版”或“字体须锐利”之类的明确要求。',
        example: '设计一张复古风格的招贴画，中心文字为“DREAM BIG”，字体清晰、排版美观、金色装饰。',
      },
    ],
  },
  {
    category: '视频生成：运动与连贯性',
    sections: [
      {
        title: '多镜头脚本结构',
        description:
          '使用 Veo 3.1 创作长视频时，将场景拆分成多个镜头。逐段描述画面主体、情绪与镜头时长，确保画面连贯。',
        example:
          '镜头 1 (0-3s)：镜头缓慢推近（Zoom In），一个戴眼镜的宇航员在红色星球上行走。\n镜头 2 (3-6s)：切换到背部视角，他望向远处悬浮的蓝色地球。',
      },
      {
        title: '精确的镜头运动指令',
        description:
          '使用“Dolly Follow”、“Handheld Shake”、“Tilt Up”这类专业运镜指令，避免含糊词汇。清晰的摄像机指令能显著提升镜头稳定性。',
        example: '在人物行走时，使用平稳的轨道跟随运镜（Dolly Follow），保持人物始终位于画面中央。',
      },
    ],
  },
  {
    category: '智能分析与联动技巧',
    sections: [
      {
        title: '图片转 Prompt 策略',
        description:
          '上传参考图或设计稿，让 AI 分析画面元素、配色与风格，并自动生成可复用的提示词，帮助保持跨项目风格统一。',
        example:
          '流程：\n1. 上传图片。\n2. 指令：“请分析这张图片，提取光影和风格关键词，生成一段 50 字的 Prompt。”\n3. 复制生成的专业 Prompt。',
      },
      {
        title: '数据到可视化的桥梁',
        description:
          '上传销售数据或运营报表，让 Gemini 总结趋势与洞察，并生成信息图提示词，快速搭建可视化内容。',
        example:
          '流程：\n1. 上传 CSV。\n2. 指令：“总结用户增长趋势，并生成一个强调‘爆炸式增长’的信息图表 Prompt。”\n3. 依据输出制作图表或继续迭代。',
      },
    ],
  },
]

const FAQ_ITEMS = [
  {
    category: '账户与计费',
    qa: [
      {
        question: '如何查看我的剩余生成点数？',
        answer: '您可以在「定价/订阅」页面的「用量仪表板」实时查看积分余额与历史消耗。',
      },
      {
        question: '订阅计划到期后，生成的作品还能使用吗？',
        answer: '是的，生成内容的版权归属您所有（详见版权条款），订阅到期不影响已生成作品的使用。',
      },
    ],
  },
  {
    category: '技术限制',
    qa: [
      {
        question: '图像的最大分辨率和格式是什么？',
        answer: '当前支持最高 1024×1024 或等比例高清图像，格式 PNG/JPG。更高分辨率正在开发中。',
      },
      {
        question: 'Veo 视频的最长生成时长是多少？',
        answer: '依据订阅计划，Veo 视频最长可达 60 秒。请在视频生成面板中设置所需时长。',
      },
    ],
  },
  {
    category: '安全与合规',
    qa: [
      {
        question: '我生成的图片可以用于商业用途吗？',
        answer: '在遵守服务条款前提下，您拥有生成内容的使用权（含商业用途）。请确保提示词与内容合法合规。',
      },
      {
        question: '为什么 Prompt 被安全过滤器拦截？',
        answer: '为遵循责任 AI 原则，我们启用了安全过滤。可能因内容涉及敏感、成人、仇恨或侵权等。请修改后来试。',
      },
    ],
  },
]

export default function HelpPage() {
  const [query, setQuery] = useState('')
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(PROMPT_ACADEMY[0].category)

  const filteredFaq = useMemo(() => {
    const text = query.trim().toLowerCase()
    if (!text) return FAQ_ITEMS
    return FAQ_ITEMS.map((block) => ({
      ...block,
      qa: block.qa.filter((item) =>
        item.question.toLowerCase().includes(text) || item.answer.toLowerCase().includes(text)
      ),
    })).filter((block) => block.qa.length > 0)
  }, [query])

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      alert('内容已复制到剪贴板')
    } catch (error) {
      alert('复制失败，请稍后再试')
    }
  }

  return (
    <main style={{ background: '#FFFFFF', color: '#101225' }}>
      <section
        style={{
          position: 'relative',
          minHeight: '420px',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          background: 'linear-gradient(120deg, #EEF2FF 0%, #F9FBFF 100%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(45% 55% at 15% 35%, rgba(58,79,255,0.18), rgba(255,255,255,0)), radial-gradient(40% 50% at 80% 60%, rgba(143,157,255,0.25), rgba(255,255,255,0))',
          }}
        />
        <div style={{ ...CONTAINER_STYLE, position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '28px', padding: '120px 72px' }}>
          <div>
            <h1 style={{ fontSize: '54px', fontWeight: 700, color: '#101225', marginBottom: '16px' }}>
              帮助中心：您创作路上的智能支持
            </h1>
            <p style={{ fontSize: '20px', lineHeight: 1.7, color: '#4B5369', maxWidth: '860px' }}>
              我们为您整理了 Gemini 图像、视频及分析功能的所有使用指南、高级技巧与常见问题解答。让您的创作之路更顺畅。
            </p>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              background: '#FFFFFF',
              border: '1px solid rgba(90,106,160,0.15)',
              borderRadius: '18px',
              padding: '16px 24px',
              boxShadow: '0 24px 70px rgba(13, 18, 40, 0.12)',
              maxWidth: '720px',
            }}
          >
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="输入您的问题或关键词，例如：'如何编写电影级 Prompt'"
              style={{
                flex: 1,
                height: '52px',
                border: 'none',
                outline: 'none',
                fontSize: '16px',
                color: '#101225',
              }}
            />
            <span style={{ fontSize: '14px', color: 'rgba(79,88,118,0.6)' }}>支持关键词搜索 FAQ</span>
          </div>
        </div>
      </section>

      <section style={{ padding: '100px 0', background: '#FFFFFF' }}>
        <div style={CONTAINER_STYLE}>
          <div style={{ marginBottom: '48px' }}>
            <h2 style={SECTION_TITLE}>核心分类导航</h2>
            <p style={SECTION_TEXT}>根据创作阶段快速定位到对应指南，帮助你在数分钟内找到答案与灵感。</p>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '28px',
            }}
          >
            {CATEGORIES.map((category) => (
              <a
                key={category.title}
                href={category.link}
                style={{
                  display: 'block',
                  padding: '32px',
                  borderRadius: '20px',
                  border: '1px solid rgba(58,79,255,0.12)',
                  background: 'linear-gradient(180deg, #FFFFFF 0%, #F7F8FF 100%)',
                  textDecoration: 'none',
                  boxShadow: '0 20px 60px rgba(10, 18, 40, 0.08)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  color: '#101225',
                }}
                onMouseEnter={(event) => {
                  const card = event.currentTarget
                  card.style.transform = 'translateY(-10px)'
                  card.style.boxShadow = '0 28px 80px rgba(58,79,255,0.16)'
                }}
                onMouseLeave={(event) => {
                  const card = event.currentTarget
                  card.style.transform = 'translateY(0)'
                  card.style.boxShadow = '0 20px 60px rgba(10, 18, 40, 0.08)'
                }}
              >
                <div style={{ fontSize: '40px', marginBottom: '18px' }}>{category.icon}</div>
                <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>{category.title}</div>
                <div style={{ fontSize: '15px', lineHeight: 1.7, color: '#4B5369' }}>{category.description}</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="prompt-academy" style={{ padding: '110px 0', background: '#F9FBFF' }}>
        <div style={CONTAINER_STYLE}>
          <div style={{ marginBottom: '48px' }}>
            <h2 style={SECTION_TITLE}>提示词学院 · The Prompt Academy</h2>
            <p style={SECTION_TEXT}>进阶掌握 Gemini 的提示词语言，透过光影、运镜与数据联动策略，获得专业级成果。</p>
          </div>
          <div style={{ display: 'grid', gap: '24px' }}>
            {PROMPT_ACADEMY.map((block) => (
              <details
                key={block.category}
                open={expandedPrompt === block.category}
                onToggle={(event) => setExpandedPrompt(event.currentTarget.open ? block.category : null)}
                style={{
                  borderRadius: '20px',
                  border: '1px solid rgba(90,106,160,0.14)',
                  background: '#FFFFFF',
                  boxShadow: '0 24px 60px rgba(10, 18, 40, 0.08)',
                  padding: '28px 32px',
                }}
              >
                <summary
                  style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#101225',
                    cursor: 'pointer',
                    listStyle: 'none',
                  }}
                >
                  {block.category}
                </summary>
                <div style={{ marginTop: '20px', display: 'grid', gap: '20px' }}>
                  {block.sections.map((section) => (
                    <div
                      key={section.title}
                      style={{
                        borderRadius: '16px',
                        background: '#F3F5FF',
                        padding: '20px 24px',
                        border: '1px solid rgba(58,79,255,0.08)',
                        display: 'grid',
                        gap: '12px',
                      }}
                    >
                      <div style={{ fontSize: '16px', fontWeight: 600, color: '#1A1F37' }}>{section.title}</div>
                      <div style={{ fontSize: '15px', lineHeight: 1.75, color: '#4B5369' }}>{section.description}</div>
                      <div
                        style={{
                          borderRadius: '14px',
                          background: '#FFFFFF',
                          padding: '16px 18px',
                          border: '1px solid rgba(58,79,255,0.12)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: '20px',
                          alignItems: 'flex-start',
                        }}
                      >
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#3A4FFF', marginTop: '2px' }}>可复制示例</div>
                        <div style={{ flex: 1, fontSize: '14px', lineHeight: 1.7, color: '#36405F' }}>{section.example}</div>
                        <button
                          type="button"
                          onClick={() => handleCopy(section.example)}
                          style={{
                            padding: '10px 16px',
                            borderRadius: '12px',
                            border: '1px solid rgba(58,79,255,0.35)',
                            background: 'rgba(58,79,255,0.08)',
                            color: '#3A4FFF',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          复制
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '110px 0', background: '#FFFFFF' }}>
        <div style={CONTAINER_STYLE}>
          <div style={{ marginBottom: '48px' }}>
            <h2 style={SECTION_TITLE}>常见问题解答</h2>
            <p style={SECTION_TEXT}>
              如果你在使用过程中遇到问题，欢迎发送邮件到
              <a href="mailto:support@aipiccenter.com" style={{ color: '#1A73E8', textDecoration: 'none', marginLeft: '6px' }}>
                support@aipiccenter.com
              </a>
              ，我们会尽快与你联系。
            </p>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '28px',
            }}
          >
            {filteredFaq.map((block) => (
              <div key={block.category} style={{ display: 'grid', gap: '16px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#101225' }}>{block.category}</h3>
                {block.qa.map((item, index) => (
                  <details
                    key={index}
                    style={{
                      borderRadius: '16px',
                      border: '1px solid rgba(90,106,160,0.15)',
                      background: '#F7F8FF',
                      padding: '18px 20px',
                    }}
                  >
                    <summary style={{ fontSize: '16px', fontWeight: 600, color: '#101225', cursor: 'pointer', listStyle: 'none' }}>
                      {item.question}
                    </summary>
                    <div style={{ fontSize: '15px', lineHeight: 1.7, color: '#4B5369', marginTop: '12px' }}>{item.answer}</div>
                  </details>
                ))}
              </div>
            ))}
            {filteredFaq.length === 0 && (
              <div style={{ fontSize: '16px', color: '#66708C' }}>未找到相关问题，试试调整搜索关键词。</div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}


