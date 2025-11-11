'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Home,
  Search,
  Image,
  Video,
  Sparkles,
  MessageCircle,
  NotepadText,
  MessageSquareMore,
  History,
  LayoutDashboard,
  Images,
  Settings,
  HelpCircle,
  CreditCard,
  ChevronRight,
  UploadCloud,
  Clock,
  Tag,
  Star,
  X,
  Send,
  LogOut,
  Smartphone,
  Shield,
  type LucideIcon,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  source?: 'google' | 'rapidapi'
}

const createMessageId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`

type StaticViewConfig = {
  title: string
  tabs: string[]
  ctaLabel: string
  cardTitle: string
  bullets: Array<{ bold: string; text: string }>
  description: string
  primaryCtaLabel?: string
}

const staticViewConfigs: Record<string, StaticViewConfig> = {
  projects: {
    title: '项目',
    tabs: ['我的项目', '与我共享', '示例：'],
    ctaLabel: '创建项目',
    cardTitle: '"项目"能为你做什么',
    bullets: [
      { bold: '创建并自定义：', text: '秒建新项目。上传文件（如文档、代码或数据），并添加具体指令来引导 Grok 的回答。' },
      { bold: '上下文对话：', text: '在项目中开启对话时，Grok 会自动将你上传的文件和自定义指令作为上下文——确保每次回答都更智能、更契合。' },
      { bold: '共享与权限协作：', text: '将项目以只读或协作方式分享给朋友、同事或团队。他们可以查看项目、文件和指令，并基于相同上下文开启自己的对话。所有对话仅对用户本人可见，其他人无法查看。' },
    ],
    description:
      '"项目"旨在让你的 Grok 体验更高效、更具协作性、更强大。无论是头脑风暴、数据分析，还是构建新内容，"项目"都能让切片并存储、贴合语境。',
    primaryCtaLabel: '＋ 创建项目',
  },
  tools: {
    title: 'AI 工具',
    tabs: ['热门', '我的工具', '自动化'],
    ctaLabel: '新建自动化',
    cardTitle: '智能工具库，随用随取',
    bullets: [
      { bold: '指令模板：', text: '使用预制 Prompt 模板快速启动自动化工作流，覆盖图像、视频、文案等创作场景。' },
      { bold: '自动执行：', text: '将常用流程保存为脚本，一键执行批量操作，让团队效率倍增。' },
      { bold: '团队共享：', text: '与成员共享自定义工具，统一最佳实践与品牌风格。' },
    ],
    description: 'AI 工具面板帮助你整合日常工作流，无论是生成内容、复审文案，还是批量处理素材，都可以在一个地方完成。',
    primaryCtaLabel: '＋ 创建工作流',
  },
  gallery: {
    title: '画廊',
    tabs: ['最新', '热门', '我的收藏'],
    ctaLabel: '上传作品',
    cardTitle: '灵感画廊，随时浏览',
    bullets: [
      { bold: '精选作品：', text: '浏览社区精选的 AI 视觉作品，获取色彩、构图、风格灵感。' },
      { bold: '分类整理：', text: '按照主题、使用模型和风格标签快速筛选，定位最契合的参考。' },
      { bold: '收藏分享：', text: '收藏作品、创建灵感清单，并与团队或客户分享。' },
    ],
    description: '在画廊中探索多样的 AI 创意表达，帮助你快速确定设计风格与视觉方向。',
    primaryCtaLabel: '＋ 创建灵感集',
  },
  messages: {
    title: '消息',
    tabs: ['系统通知', '团队提醒', '协作邀请'],
    ctaLabel: '清除已读',
    cardTitle: '集中管理所有通知',
    bullets: [
      { bold: '重要提醒：', text: '第一时间获取项目更新、权限变更和系统公告，避免错过关键信息。' },
      { bold: '协作消息：', text: '查看团队成员发来的任务留言、评论和交互反馈。' },
      { bold: '工作同步：', text: '支持快速跳转到相关项目或会话，保持工作连贯。' },
    ],
    description: '消息中心整合所有通知，帮助你掌握团队进度、系统状态与协作动态。',
    primaryCtaLabel: '全部标记为已读',
  },
  subscription: {
    title: '订阅',
    tabs: ['当前套餐', '企业版', '历史账单'],
    ctaLabel: '升级套餐',
    cardTitle: '灵活订阅，按需升级',
    bullets: [
      { bold: '套餐概览：', text: '查看当前使用的套餐、额度使用情况与即将续订的日期。' },
      { bold: '企业权益：', text: '了解企业版提供的权限管理、团队席位与成功交付支持。' },
      { bold: '账单导出：', text: '下载发票、对账单，满足财务审计与报销需求。' },
    ],
    description: '根据团队规模与项目需求，选择合适的订阅方案，保持成本可控与效率最优。',
    primaryCtaLabel: '查看套餐详情',
  },
  help: {
    title: '帮助',
    tabs: ['入门指南', '常见问题', '联系我们'],
    ctaLabel: '查看文档',
    cardTitle: '获取全方位支持',
    bullets: [
      { bold: '快速上手：', text: '查阅操作教程和视频引导，快速了解平台核心功能。' },
      { bold: '问题排查：', text: '定位常见问题的解决方案，了解最佳实践与注意事项。' },
      { bold: '人工支持：', text: '联系企业支持团队，获取专属客户成功经理的服务。' },
    ],
    description: '帮助中心覆盖从基础使用到高级功能的全套指导，让你在任何阶段都能快速获得答案。',
    primaryCtaLabel: '访问帮助中心',
  },
}

const planLabels: Record<string, string> = {
  free: '免费版',
  basic: '基础版',
  professional: '专业版',
  advanced: '高级版',
  enterprise: '企业版',
}

type SidebarItem = {
  icon: LucideIcon
  label: string
  expandedLabel?: string
  href?: string
  action?: 'search' | 'history'
  hideIconWhenExpanded?: boolean
  collapsedIcon?: ReactNode
  nonInteractive?: boolean
}

const sidebarIcons: SidebarItem[] = [
  {
    icon: Home,
    label: '首页',
    expandedLabel: 'AI PIC CENTER',
    href: '/',
    hideIconWhenExpanded: true,
    collapsedIcon: (
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '10px',
          background: '#f3f4f6',
          color: '#1f2937',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.12em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textTransform: 'uppercase',
          userSelect: 'none',
          border: '1px solid #d1d5db',
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
        }}
      >
        APC
      </div>
    ),
    nonInteractive: true,
  },
  { icon: Search, label: '搜索', action: 'search' as const },
  { icon: MessageSquareMore, label: '聊天', href: '/generate?view=chat' },
  { icon: Image, label: '图像', href: '/generate?view=image' },
  { icon: Sparkles, label: 'AI 工具', href: '/generate?view=tools' },
  { icon: History, label: '历史记录', action: 'history' as const },
  { icon: LayoutDashboard, label: '项目', href: '/generate?view=projects' },
  { icon: Images, label: '画廊', href: '/generate?view=gallery' },
  { icon: MessageCircle, label: '消息', href: '/generate?view=messages' },
]

const historySections = [
  { section: '今天', items: [{ id: 'today-1', title: '网站全屏动画设计推荐' }] },
  { section: '昨天', items: [{ id: 'yesterday-1', title: '图像生成：Flux 模型应用' }] },
  { section: '前天', items: [{ id: 'before-1', title: 'Stagewise 0.6.x 源码与构建' }] },
  { section: '11 月 22 日', items: [{ id: 'nov-1', title: '国企风格商贸公司名称生成' }] },
  { section: '11 月 18 日', items: [{ id: 'nov-2', title: '室内设计副业建议与经济应对' }] },
  { section: '11 月 11 日', items: [{ id: 'nov-3', title: 'AI Image Generation Controls' }] },
  { section: '10 月 6 日', items: [{ id: 'oct-1', title: 'ComfyUI Workflows for Highlights' }] },
  { section: '9 月 28 日', items: [{ id: 'sep-1', title: '电商主图 A/B 测试总结' }] },
  { section: '9 月 14 日', items: [{ id: 'sep-2', title: '产品发布会主持稿优化' }] },
  { section: '9 月 02 日', items: [{ id: 'sep-3', title: 'AI 图像风格测试' }] },
]

const flatHistory = historySections.flatMap((group) =>
  group.items.map((item) => ({
    ...item,
    section: group.section,
  }))
)

const searchGroups = [
  {
    section: '今天',
    items: [{ id: 'search-today', title: '侧栏导航优化技巧', subtitle: '45 分钟前' }],
  },
  {
    section: '昨天',
    items: [{ id: 'search-yesterday', title: '网站全屏动画设计推荐', subtitle: '2 小时前' }],
  },
  {
    section: '最近几天',
    items: [
      { id: 'search-1', title: '图像生成：Flux 模型应用', subtitle: '昨天' },
      { id: 'search-2', title: 'Stagewise 0.6.x 源码与构建', subtitle: '3 天前' },
      { id: 'search-3', title: '国企风格商贸公司名称生成', subtitle: '5 天前' },
      { id: 'search-4', title: '室内设计副业与经济应对建议', subtitle: '5 天前' },
      { id: 'search-5', title: 'AI Image Generation Control Panel Design', subtitle: '5 天前' },
    ],
  },
  {
    section: '本季度',
    items: [{ id: 'search-6', title: 'ComfyUI Workflows for High-Quality Images', subtitle: '10 月 15 日' }],
  },
]

const flatSearchItems = searchGroups.flatMap((group) =>
  group.items.map((item) => ({ ...item, section: group.section }))
)

export default function GenerateLandingPage() {
  const searchParams = useSearchParams()
  const view = searchParams.get('view') ?? 'chat'
  const staticView = staticViewConfigs[view]
  const router = useRouter()
  const { user, logout, loading } = useAuth()

  const [prompt, setPrompt] = useState('')
  const [hoveredSidebarIndex, setHoveredSidebarIndex] = useState<number | null>(null)
  const [navExpanded, setNavExpanded] = useState(false)
  const [historyExpanded, setHistoryExpanded] = useState(false)
  const [activeHistoryId, setActiveHistoryId] = useState('')
  const [hoveredHistoryId, setHoveredHistoryId] = useState<string | null>(null)
  const [historyOverlayOpen, setHistoryOverlayOpen] = useState(false)
  const [historyListVisible, setHistoryListVisible] = useState(false)
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSearchId, setActiveSearchId] = useState<string | null>(null)
  const [hoveredSearchId, setHoveredSearchId] = useState<string | null>(null)
  const [geminiPrompt, setGeminiPrompt] = useState('')
  const [geminiAnswer, setGeminiAnswer] = useState<string | null>(null)
  const [geminiRaw, setGeminiRaw] = useState<unknown>(null)
  const [geminiError, setGeminiError] = useState<string | null>(null)
  const [geminiLoading, setGeminiLoading] = useState(false)
  const [geminiSource, setGeminiSource] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const isGeminiTest = view === 'gemini-test'
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const filteredSearchItems = useMemo(() => {
    if (!searchQuery.trim()) return flatSearchItems
    return flatSearchItems.filter((item) =>
      item.title.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      item.subtitle?.toLowerCase().includes(searchQuery.trim().toLowerCase())
    )
  }, [searchQuery])

  useEffect(() => {
    if (!filteredSearchItems.length) {
      setActiveSearchId(null)
      return
    }
    setActiveSearchId((prev) => {
      if (prev && filteredSearchItems.some((item) => item.id === prev)) {
        return prev
      }
      return filteredSearchItems[0].id
    })
  }, [filteredSearchItems])

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/')
    }
  }, [loading, user, router])

  const previewSearchItem = useMemo(() => {
    if (hoveredSearchId) {
      return flatSearchItems.find((item) => item.id === hoveredSearchId) || null
    }
    if (activeSearchId) {
      return flatSearchItems.find((item) => item.id === activeSearchId) || null
    }
    return null
  }, [hoveredSearchId, activeSearchId])

  useEffect(() => {
    setHistoryOverlayOpen(false)
    if (!navExpanded) {
      setHistoryExpanded(false)
      setHistoryListVisible(false)
    } else {
      setHistoryListVisible(false)
      const timer = window.setTimeout(() => setHistoryListVisible(true), 260)
      return () => window.clearTimeout(timer)
    }
  }, [navExpanded])

  const renderStaticView = (config: StaticViewConfig) => (
    <div
      style={{
        width: '100%',
        maxWidth: '760px',
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
      }}
      onMouseDown={(event) => {
        if (event.detail > 1) {
          event.preventDefault()
        }
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#111827', margin: 0 }}>{config.title}</h1>
          <nav
            style={
              {
                display: 'flex',
                gap: '20px',
                marginTop: '16px',
                fontSize: '14px',
                color: '#6b7280',
              }
            }
          >
            {config.tabs.map((tab, index) => (
              <span
                key={tab}
                style={
                  index === 0
                    ? { color: '#111827', fontWeight: 600, paddingBottom: '6px', borderBottom: '2px solid #111827' }
                    : undefined
                }
                onMouseDown={(event) => event.preventDefault()}
              >
                {tab}
              </span>
            ))}
          </nav>
        </div>
        <button
          style={{
            padding: '10px 18px',
            borderRadius: '999px',
            border: '1px solid #e5e7eb',
            backgroundColor: '#ffffff',
            color: '#111827',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span style={{ fontSize: '16px', lineHeight: 1 }}>＋</span>
          {config.ctaLabel}
        </button>
      </header>

      <section
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)',
          padding: '32px 36px 36px',
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', margin: 0, marginBottom: '16px' }}>{config.cardTitle}</h2>
        <ul style={{ listStyle: 'disc', paddingLeft: '20px', color: '#374151', lineHeight: 1.7, fontSize: '14px' }}>
          {config.bullets.map((item) => (
            <li key={item.bold}>
              <strong>{item.bold}</strong>
              {item.text}
            </li>
          ))}
        </ul>
        <p style={{ marginTop: '16px', fontSize: '14px', color: '#4b5563', lineHeight: 1.7 }}>{config.description}</p>
        {config.primaryCtaLabel && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
            <button
              style={{
                padding: '12px 28px',
                borderRadius: '999px',
                border: 'none',
                backgroundColor: '#111827',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 16px 32px rgba(17, 24, 39, 0.2)',
              }}
            >
              {config.primaryCtaLabel}
            </button>
          </div>
        )}
      </section>
    </div>
  )

  const renderSettingsView = () => {
    if (!user) {
      return (
        <div
          style={{
            width: '100%',
            maxWidth: '760px',
            padding: '80px 24px',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)',
          }}
        >
          <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '16px' }}>请先登录以查看账户信息。</p>
          <Link
            href="/auth"
            style={{
              padding: '10px 22px',
              borderRadius: '999px',
              backgroundColor: '#1A73E8',
              color: '#ffffff',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            去登录
          </Link>
        </div>
      )
    }

    const planLabel = planLabels[user.plan] ?? (user.plan || '免费版')
    const planExpire = user.planExpiresAt ? new Date(user.planExpiresAt).toLocaleDateString('zh-CN') : '长期有效'

    return (
      <div style={{ width: '100%', maxWidth: '760px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#111827', margin: 0 }}>我的账户</h1>
            <nav
              style={{
                display: 'flex',
                gap: '20px',
                marginTop: '16px',
                fontSize: '14px',
                color: '#6b7280',
              }}
            >
              <span style={{ color: '#111827', fontWeight: 600, paddingBottom: '6px', borderBottom: '2px solid #111827' }}>账户总览</span>
              <span>订阅权益</span>
              <span>安全设置</span>
            </nav>
          </div>
          <button
            onClick={() => router.push('/pricing')}
            style={{
              padding: '10px 18px',
              borderRadius: '999px',
              border: '1px solid #e5e7eb',
              backgroundColor: '#ffffff',
              color: '#111827',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '16px', lineHeight: 1 }}>＋</span>
            升级计划
          </button>
        </header>

        <section
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)',
            padding: '32px 36px 36px',
          }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', margin: 0, marginBottom: '16px' }}>账户信息总览</h2>
          <ul style={{ listStyle: 'disc', paddingLeft: '20px', color: '#374151', lineHeight: 1.7, fontSize: '14px' }}>
            <li>
              <strong>登录手机号：</strong>
              {user.phone}
            </li>
            <li>
              <strong>用户名：</strong>
              {user.username || '未设置'}
            </li>
            <li>
              <strong>当前订阅：</strong>
              {planLabel}（到期时间：{planExpire}）
            </li>
            <li>
              <strong>账户信用点：</strong>
              {user.credits} 点，可用于图像/视频生成
            </li>
          </ul>
          <p style={{ marginTop: '16px', fontSize: '14px', color: '#4b5563', lineHeight: 1.7 }}>
            这是您在 AI Pic Center 的账户中心，所有基础资料、订阅计划与信用点都会保存在这里。想要扩充额度或升级团队协作能力，随时可以点击右上角的"升级计划"。
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginTop: '24px',
            }}
          >
            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '18px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                backgroundColor: '#F9FAFB',
              }}
            >
              <Smartphone style={{ width: '24px', height: '24px', color: '#1A73E8', marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>安全登录</div>
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', lineHeight: 1.6 }}>
                  使用验证码即可完成登录，无需记忆复杂密码。保持手机号安全即可保障账户安全。
                </p>
              </div>
            </div>

            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '18px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                backgroundColor: '#F9FAFB',
              }}
            >
              <CreditCard style={{ width: '24px', height: '24px', color: '#F97316', marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>信用点使用</div>
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', lineHeight: 1.6 }}>
                  每次生成图像或视频都会使用信用点。进入"订阅"页面可以随时充值或升级套餐。
                </p>
              </div>
            </div>

            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '18px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                backgroundColor: '#F9FAFB',
              }}
            >
              <Shield style={{ width: '24px', height: '24px', color: '#16A34A', marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>隐私与安全</div>
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', lineHeight: 1.6 }}>
                  我们遵循企业级的数据安全标准，所有内容仅对您本人可见。可在"帮助"页面查看更多隐私说明。
                </p>
              </div>
            </div>

            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '18px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                backgroundColor: '#F9FAFB',
              }}
            >
              <Clock style={{ width: '24px', height: '24px', color: '#9333EA', marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>订阅状态</div>
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', lineHeight: 1.6 }}>
                  当前订阅：{planLabel}，有效期至 {planExpire}。如需开具发票或企业开通，请联系客户成功经理。
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e5e7eb',
            padding: '28px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>常用操作</h3>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <Link
              href="/generate?view=subscription"
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: '1px solid #DBEAFE',
                backgroundColor: '#EEF2FF',
                color: '#1A73E8',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              查看订阅权益
            </Link>
            <Link
              href="/generate?view=help"
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: '1px solid #FCE7F3',
                backgroundColor: '#FFF1F9',
                color: '#DB2777',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              访问帮助中心
            </Link>
            <Link
              href="/generate?view=messages"
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: '1px solid #FEF3C7',
                backgroundColor: '#FFFBEB',
                color: '#B45309',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              查看通知与消息
            </Link>
          </div>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>
            如需企业版开通、发票或更多自定义支持，可发送邮件至 <a href="mailto:service@aipiccenter.com" style={{ color: '#1A73E8', textDecoration: 'none' }}>service@aipiccenter.com</a>，我们的客户成功团队会尽快联系您。
          </p>
        </section>
      </div>
    )
  }

  useEffect(() => {
    if (!navExpanded) {
      setUserMenuOpen(false)
    }
  }, [navExpanded])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userMenuOpen])

  useEffect(() => {
    const shouldLock = historyOverlayOpen || searchOverlayOpen
    document.body.style.overflow = shouldLock ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [historyOverlayOpen, searchOverlayOpen])

  useEffect(() => {
    if (searchOverlayOpen) {
      setSearchQuery('')
      setActiveSearchId(flatSearchItems[0]?.id ?? null)
    }
  }, [searchOverlayOpen])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setHistoryOverlayOpen(false)
        setSearchOverlayOpen(false)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => {
    if (!navExpanded) {
      return
    }
    const handleClick = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setNavExpanded(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
    }
  }, [navExpanded])

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages, chatLoading])

  const handleSubmitGemini = async () => {
    if (!geminiPrompt.trim() || geminiLoading) {
      return
    }

    setGeminiLoading(true)
    setGeminiError(null)

    try {
      const response = await fetch('/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: geminiPrompt.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        setGeminiError(data?.error || '调用失败，请稍后再试。')
        setGeminiAnswer(null)
        setGeminiRaw(null)
        setGeminiSource(null)
        return
      }

      setGeminiAnswer(data?.text ?? '')
      setGeminiRaw(data?.raw ?? data)
      setGeminiSource(data?.source ?? null)
      setGeminiPrompt('')
    } catch (error) {
      console.error('Gemini 调用错误:', error)
      setGeminiError('服务器异常，请稍后再试。')
      setGeminiAnswer(null)
      setGeminiRaw(null)
      setGeminiSource(null)
    } finally {
      setGeminiLoading(false)
    }
  }

  const handleSendChat = useCallback(async () => {
    const trimmed = prompt.trim()
    if (!trimmed || chatLoading) {
      return
    }

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: 'user',
      content: trimmed,
    }

    const conversationPayload = [...chatMessages, userMessage].map((message) => ({
      role: message.role,
      content: message.content,
    }))

    setChatMessages((prev) => [...prev, userMessage])
    setPrompt('')
    setChatError(null)
    setChatLoading(true)

    try {
      const response = await fetch('/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversationPayload }),
      })

      const data = await response.json()

      if (!response.ok) {
        const message =
          (typeof data?.error === 'string' && data.error.trim()) || '调用失败，请稍后再试。'
        setChatError(message)
        return
      }

      const text =
        (typeof data?.text === 'string' && data.text.trim()) || '（无内容）'
      const sourceValue = typeof data?.source === 'string' ? data.source : undefined

      setChatMessages((prev) => [
        ...prev,
        {
          id: createMessageId(),
          role: 'assistant',
          content: text,
          source: sourceValue === 'google' || sourceValue === 'rapidapi' ? sourceValue : undefined,
        },
      ])
    } catch (error) {
      console.error('调用 Gemini 失败:', error)
      setChatError('网络异常，请稍后再试。')
    } finally {
      setChatLoading(false)
    }
  }, [prompt, chatLoading, chatMessages])

  const handlePromptKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        handleSendChat()
      }
    },
    [handleSendChat]
  )

  const renderGeminiTestView = () => (
    <div style={{ width: '100%', maxWidth: '780px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: 0 }}>Gemini 接口测试</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
          这是一个调试页面，优先调用 Google 官方 Gemini API；若未配置官方密钥，则回退至 RapidAPI 封装的接口。输入提示词后按 Enter（或点击发送）即可发起请求。
        </p>
      </header>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          handleSubmitGemini()
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          padding: '20px',
          background: '#ffffff',
          boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)',
        }}
      >
        <label style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
          提示词
          <span style={{ marginLeft: '6px', fontSize: '12px', color: '#9ca3af' }}>（Enter 发送，Shift + Enter 换行）</span>
        </label>
        <textarea
          value={geminiPrompt}
          onChange={(event) => setGeminiPrompt(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              handleSubmitGemini()
            }
          }}
          rows={5}
          placeholder="例如：简要介绍香港的夜生活，用两句话。"
          style={{
            width: '100%',
            borderRadius: '12px',
            border: '1px solid #d1d5db',
            padding: '14px 16px',
            fontSize: '14px',
            lineHeight: 1.6,
            resize: 'vertical',
            outline: 'none',
            color: '#111827',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>提示：RapidAPI 免费额度有限，请避免高频调用。</span>
          <button
            type="submit"
            disabled={geminiLoading || !geminiPrompt.trim()}
            style={{
              padding: '10px 20px',
              borderRadius: '999px',
              border: 'none',
              backgroundColor: geminiLoading || !geminiPrompt.trim() ? '#E5E7EB' : '#111827',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: geminiLoading || !geminiPrompt.trim() ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s ease',
            }}
          >
            {geminiLoading ? '调用中…' : '发送'}
          </button>
        </div>
      </form>

      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          background: '#ffffff',
          padding: '20px',
          minHeight: '180px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>返回结果</h2>
          {geminiSource && (
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '999px',
                background: geminiSource === 'google' ? '#ECFDF5' : '#EFF6FF',
                color: geminiSource === 'google' ? '#047857' : '#1D4ED8',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              {geminiSource === 'google' ? 'Google Gemini API' : 'RapidAPI 代理'}
            </span>
          )}
        </div>
        {geminiError ? (
          <div style={{ color: '#DC2626', fontSize: '14px' }}>{geminiError}</div>
        ) : geminiAnswer ? (
          <div style={{ fontSize: '14px', color: '#111827', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{geminiAnswer}</div>
        ) : (
          <div style={{ fontSize: '13px', color: '#9ca3af' }}>尚无结果，请在上方输入提示词后发送。</div>
        )}
      </section>

      {geminiRaw && (
        <details
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: '14px',
            background: '#ffffff',
            padding: '16px',
            color: '#111827',
          }}
        >
          <summary style={{ cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>查看原始 JSON</summary>
          <pre
            style={{
              marginTop: '12px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: '12px',
              color: '#374151',
              background: '#F9FAFB',
              padding: '12px',
              borderRadius: '10px',
              maxHeight: '320px',
              overflow: 'auto',
            }}
          >
            {JSON.stringify(geminiRaw, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )

  if (loading) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
        }}
      >
        <span style={{ fontSize: '14px', color: '#6b7280' }}>正在加载账户信息…</span>
      </main>
    )
  }

  if (!user) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          padding: '32px',
        }}
      >
        <div
          style={{
            padding: '36px 44px',
            borderRadius: '18px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 24px 48px rgba(15, 23, 42, 0.12)',
            backgroundColor: '#ffffff',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '16px', color: '#111827', marginBottom: '16px' }}>请先登录以访问控制台。</p>
          <Link
            href="/"
            style={{
              fontSize: '14px',
              color: '#1A73E8',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            返回首页
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#ffffff',
      }}
    >
      <aside
        ref={navRef}
        onClick={(event) => {
          if (event.target === navRef.current) {
            if (navExpanded) {
              setNavExpanded(false)
              setHistoryOverlayOpen(false)
            } else {
              setNavExpanded(true)
              setHistoryOverlayOpen(false)
              setHistoryExpanded(false)
            }
          }
        }}
        style={{
          width: navExpanded ? '240px' : '64px',
          borderRight: '1px solid #f0f0f0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '26px 12px',
          transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          backgroundColor: '#ffffff',
          overflow: 'visible',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: navExpanded ? '12px' : '16px', alignItems: navExpanded ? 'stretch' : 'center', paddingTop: navExpanded ? '0' : '20px' }}>
          {sidebarIcons.map((item, index) => {
            const Icon = item.icon
            const isHistory = item.action === 'history'
            const isSearch = item.action === 'search'
            const isHovered = hoveredSidebarIndex === index
            const isHistoryActive = isHistory && historyExpanded && navExpanded
            const shouldShowIcon = !(navExpanded && item.hideIconWhenExpanded)
            const expandedLabelJustify = shouldShowIcon ? 'flex-start' : 'center'
            const defaultIconElement = <Icon style={{ width: '18px', height: '18px' }} />
            const iconElement = !navExpanded && item.collapsedIcon ? item.collapsedIcon : defaultIconElement

            if (item.nonInteractive) {
              return (
                <div
                  key={item.label}
                  style={{
                    width: '100%',
                    height: '44px',
                    position: 'relative',
                    marginBottom: '20px',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: '32px',
                      top: '50%',
                      transform: 'translate(-32px, -50%)',
                      width: '32px',
                      height: '32px',
                      borderRadius: '10px',
                      background: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#1f2937',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      userSelect: 'none',
                      pointerEvents: 'none',
                      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
                    }}
                  >
                    APC
                  </div>
                </div>
              )
            }

            const collapsedStyle = {
              width: '32px',
              height: '32px',
              borderRadius: '16px',
              border: 'none',
              backgroundColor: isHistoryActive || isHovered ? '#F3F4F6' : 'transparent',
              color: '#1f2937',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              transition: 'transform 0.2s ease, color 0.2s ease, background-color 0.2s ease',
              transform: isHovered ? 'scale(1.12)' : 'scale(1)',
              userSelect: 'none',
            } as const

            const expandedStyle = {
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: isHistoryActive || isHovered ? '#F3F4F6' : 'transparent',
              color: '#1f2937',
              cursor: 'pointer',
              textDecoration: 'none',
              justifyContent: expandedLabelJustify,
              transition: 'background-color 0.2s ease, color 0.2s ease',
              position: 'relative',
              paddingLeft: shouldShowIcon ? '12px' : '0',
              paddingRight: shouldShowIcon ? '12px' : '0',
              userSelect: 'none',
            } as const

            if (isHistory) {
              return (
                <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: navExpanded ? '6px' : '12px' }}>
                  <button
                    title={item.label}
                    onMouseEnter={() => setHoveredSidebarIndex(index)}
                    onMouseLeave={() => setHoveredSidebarIndex(null)}
                    onClick={(event) => {
                      event.stopPropagation()
                      if (!navExpanded) {
                        setHistoryOverlayOpen((prev) => !prev)
                        return
                      }
                      setHistoryExpanded((prev) => !prev)
                    }}
                    style={navExpanded ? expandedStyle : collapsedStyle}
                  >
                    {shouldShowIcon && iconElement}
                    <span
                      style={{
                        opacity: navExpanded ? 1 : 0,
                        maxWidth: navExpanded ? '140px' : '0',
                        transform: navExpanded ? 'translateX(0)' : 'translateX(-8px)',
                        transition: 'opacity 0.24s ease, max-width 0.24s ease, transform 0.24s ease',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        fontSize: navExpanded && item.hideIconWhenExpanded ? '15px' : '14px',
                        fontWeight: navExpanded && item.hideIconWhenExpanded ? 700 : 600,
                        fontFamily: navExpanded && item.hideIconWhenExpanded ? '"Roboto", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif' : 'inherit',
                        letterSpacing: navExpanded && item.hideIconWhenExpanded ? '0.08em' : undefined,
                        textAlign: shouldShowIcon ? 'left' : 'center',
                        userSelect: 'none',
                      }}
                    >
                      {navExpanded && item.expandedLabel ? item.expandedLabel : item.label}
                    </span>
                    {navExpanded && (
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: '12px',
                          color: '#9ca3af',
                          transition: 'opacity 0.24s ease',
                          opacity: navExpanded ? 1 : 0,
                        }}
                      >
                        {historyExpanded ? '收起' : '展开'}
                      </span>
                    )}
                  </button>
                  {navExpanded && historyExpanded && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        marginLeft: '8px',
                        opacity: historyListVisible ? 1 : 0,
                        transition: 'opacity 0.2s ease',
                        pointerEvents: historyListVisible ? 'auto' : 'none',
                      }}
                    >
                      {flatHistory.slice(0, 10).map((historyItem) => {
                        const isActiveHistory = historyItem.id === activeHistoryId
                        const isHoveredHistory = historyItem.id === hoveredHistoryId
                        return (
                          <button
                            key={historyItem.id}
                            onClick={() => setActiveHistoryId(historyItem.id)}
                            onMouseEnter={() => setHoveredHistoryId(historyItem.id)}
                            onMouseLeave={() => setHoveredHistoryId(null)}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              border: 'none',
                              backgroundColor: isActiveHistory ? '#F3F4F6' : isHoveredHistory ? '#F9FAFB' : 'transparent',
                              padding: '2px 6px',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px',
                              borderRadius: '6px',
                              transition: 'background-color 0.2s ease',
                            }}
                          >
                            <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>{historyItem.section}</span>
                            <span
                              style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#111827',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {historyItem.title}
                            </span>
                          </button>
                        )
                      })}
                      <button
                        style={{
                          alignSelf: 'flex-start',
                          fontSize: '12px',
                          color: '#1A73E8',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        查看全部
                      </button>
                    </div>
                  )}
                </div>
              )
            }

            if (isSearch) {
              return (
                <button
                  key={item.label}
                  title={item.label}
                  onMouseEnter={() => setHoveredSidebarIndex(index)}
                  onMouseLeave={() => setHoveredSidebarIndex(null)}
                  onClick={(event) => {
                    event.stopPropagation()
                    setNavExpanded(false)
                    setHistoryOverlayOpen(false)
                    setSearchOverlayOpen(true)
                    setActiveSearchId(flatSearchItems[0]?.id ?? null)
                  }}
                  style={navExpanded ? expandedStyle : collapsedStyle}
                >
                  {shouldShowIcon && iconElement}
                  <span
                    style={{
                      opacity: navExpanded ? 1 : 0,
                      maxWidth: navExpanded ? '140px' : '0',
                      transform: navExpanded ? 'translateX(0)' : 'translateX(-8px)',
                      transition: 'opacity 0.24s ease, max-width 0.24s ease, transform 0.24s ease',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      fontSize: navExpanded ? '15px' : '14px',
                      fontWeight: 500,
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              )
            }

            if (item.href) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  title={item.label}
                  onMouseEnter={() => setHoveredSidebarIndex(index)}
                  onMouseLeave={() => setHoveredSidebarIndex(null)}
                  onClick={(event) => {
                    event.stopPropagation()
                    if (!navExpanded) {
                      return
                    }
                    setNavExpanded(false)
                    setHistoryOverlayOpen(false)
                  }}
                  style={navExpanded ? expandedStyle : collapsedStyle}
                >
                  {shouldShowIcon && iconElement}
                  <span
                    style={{
                      opacity: navExpanded ? 1 : 0,
                      maxWidth: navExpanded ? '140px' : '0',
                      transform: navExpanded ? 'translateX(0)' : 'translateX(-8px)',
                      transition: 'opacity 0.24s ease, max-width 0.24s ease, transform 0.24s ease',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      fontSize: navExpanded ? '15px' : '14px',
                      fontWeight: 500,
                    }}
                  >
                    {navExpanded && item.expandedLabel ? item.expandedLabel : item.label}
                  </span>
                </Link>
              )
            }

            return null
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto', position: 'relative', height: '60px' }}>
          {user ? (
            <div
              ref={userMenuRef}
              style={{
                position: 'absolute',
                bottom: 0,
                left: '32px',
                transform: 'translateX(-32px)',
              }}
            >
              <div style={{ position: 'relative' }}>
                <button
                  title={user.username || user.phone}
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  onContextMenu={(event) => event.preventDefault()}
                  draggable={false}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '18px',
                    border: 'none',
                    backgroundColor: '#D1431F',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textTransform: 'uppercase',
                    boxShadow: '0 4px 12px rgba(209, 67, 31, 0.25)',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none',
                  }}
                >
                  {(user.username || user.phone || 'U').charAt(0)}
                </button>
                {userMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 12px)',
                      left: navExpanded ? 'calc(100% + 12px)' : 'calc(100% + 20px)',
                      transform: 'none',
                      backgroundColor: '#ffffff',
                      borderRadius: '18px',
                      boxShadow: '0 20px 40px rgba(15, 23, 42, 0.18)',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      zIndex: 20,
                      minWidth: '160px',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Settings style={{ width: '18px', height: '18px', color: '#1f2937' }} />
                      <Link
                        href="/generate?view=settings"
                        onClick={() => setUserMenuOpen(false)}
                        style={{ fontSize: '13px', color: '#111827', textDecoration: 'none', lineHeight: 1 }}
                      >
                        设置
                      </Link>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Clock style={{ width: '18px', height: '18px', color: '#1f2937' }} />
                      <Link
                        href="/generate?view=projects"
                        onClick={() => setUserMenuOpen(false)}
                        style={{ fontSize: '13px', color: '#111827', textDecoration: 'none', lineHeight: 1 }}
                      >
                        任务
                      </Link>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Tag style={{ width: '18px', height: '18px', color: '#1f2937' }} />
                      <Link
                        href="/generate?view=gallery"
                        onClick={() => setUserMenuOpen(false)}
                        style={{ fontSize: '13px', color: '#111827', textDecoration: 'none', lineHeight: 1 }}
                      >
                        文件
                      </Link>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <HelpCircle style={{ width: '18px', height: '18px', color: '#1f2937' }} />
                        <Link
                          href="/generate?view=help"
                          onClick={() => setUserMenuOpen(false)}
                          style={{ fontSize: '13px', color: '#111827', textDecoration: 'none', lineHeight: 1 }}
                        >
                          帮助
                        </Link>
                      </div>
                      <ChevronRight style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CreditCard style={{ width: '18px', height: '18px', color: '#1f2937' }} />
                      <Link
                        href="/generate?view=subscription"
                        onClick={() => setUserMenuOpen(false)}
                        style={{ fontSize: '13px', color: '#111827', textDecoration: 'none', lineHeight: 1 }}
                      >
                        升级套餐
                      </Link>
                    </div>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        logout()
                        router.push('/')
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '13px',
                        color: '#ef4444',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <LogOut style={{ width: '18px', height: '18px' }} />
                      退出登陆
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link
              href="/?authModal=1"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '18px',
                border: 'none',
                backgroundColor: '#D1431F',
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '15px',
                fontWeight: 600,
                alignSelf: navExpanded ? 'flex-start' : 'center',
                textTransform: 'uppercase',
                boxShadow: '0 4px 12px rgba(209, 67, 31, 0.25)',
              }}
            >
              登
            </Link>
          )}
        </div>
      </aside>

      {historyOverlayOpen && !navExpanded && (
        <div
          onClick={() => setHistoryOverlayOpen(false)}
          style={{
            position: 'fixed',
            top: '64px',
            left: '56px',
            width: '300px',
            height: 'calc(100vh - 64px)',
            backgroundColor: '#ffffff',
            boxShadow: '12px 0 32px rgba(15, 23, 42, 0.18)',
            borderRight: '1px solid #e5e7eb',
            padding: '24px 20px',
            zIndex: 950,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>历史记录</div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              overflowY: 'auto',
              flex: 1,
            }}
          >
            {flatHistory.slice(0, 10).map((historyItem) => (
              <button
                key={historyItem.id}
                onClick={(event) => {
                  event.stopPropagation()
                  setActiveHistoryId(historyItem.id)
                  setHistoryOverlayOpen(false)
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  backgroundColor: activeHistoryId === historyItem.id ? '#F3F4F6' : 'transparent',
                  padding: '6px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={() => setHoveredHistoryId(historyItem.id)}
                onMouseLeave={() => setHoveredHistoryId(null)}
              >
                <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>{historyItem.section}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {historyItem.title}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={(event) => {
              event.stopPropagation()
              setHistoryOverlayOpen(false)
            }}
            style={{
              alignSelf: 'flex-start',
              fontSize: '12px',
              color: '#1A73E8',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            查看全部
          </button>
        </div>
      )}

      {searchOverlayOpen && (
        <div
          onClick={() => setSearchOverlayOpen(false)}
          style={{
            position: 'fixed',
            top: '64px',
            left: 0,
            width: '100vw',
            height: 'calc(100vh - 64px)',
            backgroundColor: 'rgba(15, 23, 42, 0.35)',
            backdropFilter: 'blur(8px)',
            zIndex: 960,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(1280px, calc(100vw - 24px))',
              height: 'min(1280px, calc(100vh - 48px))',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 28px 80px rgba(15, 23, 42, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <header
              style={{
                padding: '24px 28px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="搜索..."
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '18px',
                  color: '#111827',
                }}
              />
              <Search style={{ width: '18px', height: '18px', color: '#9ca3af' }} />
            </header>
            <div style={{ flex: 1, display: 'flex' }}>
              <div
                style={{
                  width: '320px',
                  borderRight: '1px solid #e5e7eb',
                  padding: '12px 14px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1px',
                  overflowY: 'auto',
                }}
              >
                {filteredSearchItems.length ? (
                  filteredSearchItems.map((item) => {
                    const isActive = item.id === activeSearchId
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSearchId(item.id)}
                        style={{
                          width: '100%',
                          border: 'none',
                          textAlign: 'left',
                          borderRadius: '6px',
                          padding: '4px 6px',
                          backgroundColor: hoveredSearchId === item.id ? '#F3F4F6' : 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0px',
                          transition: 'background-color 0.2s ease',
                        }}
                        onMouseEnter={() => setHoveredSearchId(item.id)}
                        onMouseLeave={() => setHoveredSearchId(null)}
                      >
                        <span style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          {item.section}
                        </span>
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#111827',
                          }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
                          {item.subtitle && <span style={{ fontSize: '12px', fontWeight: 400, color: '#6b7280', flexShrink: 0 }}>{item.subtitle}</span>}
                        </span>
                      </button>
                    )
                  })
                ) : (
                  <div style={{ fontSize: '13px', color: '#9ca3af' }}>未找到匹配内容</div>
                )}
              </div>
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9ca3af',
                  fontSize: '14px',
                  padding: '0 48px',
                }}
              >
                {previewSearchItem ? (
                  <div style={{ width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '12px', color: '#111827' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#9ca3af' }}>
                      <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>{previewSearchItem.section}</span>
                      {previewSearchItem.subtitle && <span style={{ color: '#6b7280' }}>{previewSearchItem.subtitle}</span>}
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, lineHeight: 1.4 }}>{previewSearchItem.title}</h3>
                    <div
                      style={{
                        fontSize: '14px',
                        color: '#4b5563',
                        lineHeight: 1.6,
                      }}
                    >
                      预览内容示例：这是"{previewSearchItem.title}"的完整摘要区域，未来可以显示对话首段、关键词或高亮匹配结果。当前为静态占位，后续可接入真实数据。
                    </div>
                  </div>
                ) : (
                  '请选择结果查看详情'
                )}
              </div>
            </div>
            <footer
              style={{
                borderTop: '1px solid #e5e7eb',
                padding: '16px 24px',
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>按 Esc 关闭</span>
            </footer>
          </div>
        </div>
      )}

      <section
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '48px 0',
          width: '100%',
        }}
      >
        {view === 'settings' ? (
          renderSettingsView()
        ) : isGeminiTest ? (
          renderGeminiTestView()
        ) : staticView ? (
          renderStaticView(staticView)
        ) : (
          <div style={{ width: '100%', maxWidth: '780px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div
              ref={chatContainerRef}
              style={{
                flex: 1,
                maxHeight: '520px',
                border: '1px solid #e5e7eb',
                borderRadius: '18px',
                padding: '24px',
                backgroundColor: '#ffffff',
                overflowY: 'auto',
                boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)',
              }}
            >
              {chatMessages.length === 0 ? (
                <div style={{ fontSize: '14px', color: '#9ca3af', textAlign: 'center' }}>
                  开始新的对话吧，问我任何问题。
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
                        gap: '6px',
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '85%',
                          borderRadius: '18px',
                          padding: '12px 16px',
                          backgroundColor: message.role === 'user' ? '#111827' : '#F3F4F6',
                          color: message.role === 'user' ? '#ffffff' : '#111827',
                          fontSize: '14px',
                          lineHeight: 1.6,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {message.content}
                      </div>
                      {message.source && (
                        <span
                          style={{
                            fontSize: '11px',
                            color: '#9ca3af',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                          }}
                        >
                          {message.source === 'google' ? 'Google Gemini' : 'RapidAPI Proxy'}
                        </span>
                      )}
                    </div>
                  ))}
                  {chatLoading && (
                    <div style={{ fontSize: '13px', color: '#9ca3af' }}>助手正在思考...</div>
                  )}
                </div>
              )}
            </div>

            {chatError && (
              <div
                style={{
                  fontSize: '13px',
                  color: '#dc2626',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                }}
              >
                {chatError}
              </div>
            )}

            <div
              style={{
                borderRadius: '26px',
                border: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                padding: '11px 16px',
                gap: '12px',
                background: '#ffffff',
                boxShadow: '0 12px 38px rgba(0, 0, 0, 0.08)',
              }}
            >
              <button
                title="上传文件"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '20px',
                  border: 'none',
                  backgroundColor: '#F3F4F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1F2937',
                  cursor: 'pointer',
                }}
              >
                <UploadCloud style={{ width: '20px', height: '20px' }} />
              </button>
              <input
                type="text"
                placeholder="输入内容，按 Enter 发送"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={handlePromptKeyDown}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '16px',
                  color: '#111827',
                }}
              />
              <button
                title="发送"
                onClick={handleSendChat}
                disabled={chatLoading || !prompt.trim()}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '18px',
                  border: 'none',
                  backgroundColor: chatLoading || !prompt.trim() ? '#E5E7EB' : '#111827',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: chatLoading || !prompt.trim() ? '#9CA3AF' : '#FFFFFF',
                  cursor: chatLoading || !prompt.trim() ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
              >
                <Send style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}