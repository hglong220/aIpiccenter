'use client'

import NextImage from 'next/image'
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
  LayoutDashboard,
  Images,
  Settings,
  HelpCircle,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Mic,
  UploadCloud,
  Clock,
  Tag,
  Star,
  X,
  Play,
  LogOut,
  Smartphone,
  Shield,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  FileText,
  Users,
  Copy,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { AIToolsSidebar, type AITool } from '@/components/generate/AIToolsSidebar'
import { GalleryView } from '@/components/generate/GalleryView'

type ModelOption = '自动模式' | '快速模式' | '专家模式' | '图片' | '视频'

type AspectOption = {
  id: 'portrait' | 'landscape' | 'square'
  label: string
}

const aspectOptions: AspectOption[] = [
  { id: 'portrait', label: '竖屏' },
  { id: 'landscape', label: '横屏' },
  { id: 'square', label: '方形' },
]

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

type AIToolPromptConfig = {
  view: 'image' | 'video'
  aspect?: AspectOption['id']
  prompt: string
  hint?: string
}

const aiToolPromptConfigs: Record<string, AIToolPromptConfig> = {
  upscale: {
    view: 'image',
    aspect: 'square',
    prompt:
      '你是一名专业的图像超分与修复专家，请对用户上传的图片进行高清放大和画质增强：\n' +
      '- 放大倍数：尽可能提升分辨率，但保持画面自然、不失真\n' +
      '- 不新增任何元素，不改变主体、构图和风格\n' +
      '- 去除噪点、锯齿、模糊，保留真实的纹理细节\n' +
      '- 如果画面中有人脸或产品，优先保证其清晰度和质感\n' +
      '- 输出为高分辨率 PNG，适合电商或精细展示场景。',
    hint: '已为你准备“图片高清放大”的高质量提示词，请上传图片后点击生成。',
  },
  'ecommerce-poster': {
    view: 'image',
    aspect: 'portrait',
    prompt:
      '请为一个电商场景生成高转化率的促销海报图：\n' +
      '- 主体：清晰突出单一主商品，背景干净简洁\n' +
      '- 风格：现代、干净、高级，符合主流电商平台（如淘宝、京东）视觉规范\n' +
      '- 文案元素：预留主标题、副标题、价格标签和行动按钮位置，但不要写具体文字\n' +
      '- 画面层次：主体居中或偏视觉重心，光影自然，颜色对比明确\n' +
      '- 请避免过度复杂的背景，不要偏离“电商促销海报”的主题。',
    hint: '已为你准备电商海报的提示词，可在生成前在输入框中补充商品名称、价格等信息。',
  },
  'product-image': {
    view: 'image',
    aspect: 'square',
    prompt:
      '生成一张适合电商详情页或独立站展示的产品图：\n' +
      '- 主体：单一产品，轮廓清晰，无遮挡\n' +
      '- 背景：干净的纯色或轻微渐变背景，突出产品，不要复杂场景\n' +
      '- 光影：柔和自然的打光，显示材质质感（如金属、玻璃、皮革等）\n' +
      '- 风格：高端、真实、无夸张特效，符合苹果官网等精致产品图风格\n' +
      '- 不添加文字和 Logo，避免出现多余装饰元素。',
    hint: '已为你准备“产品图制作”的提示词，可在生成前补充产品类型和风格偏好。',
  },
  'interior-design': {
    view: 'image',
    aspect: 'landscape',
    prompt:
      '请生成一张室内空间效果图：\n' +
      '- 场景：完整的室内空间（如客厅、卧室、书房等），构图自然\n' +
      '- 风格：现代简约，色彩和谐，注重采光和材质细节\n' +
      '- 画面元素：合理的家具布局、软装和灯光设计，不要堆砌物品\n' +
      '- 重点体现空间的层次感和舒适度，可适当加入绿植与生活气息\n' +
      '- 不使用夸张的梦幻效果，保持专业室内设计渲染风格。',
    hint: '已为你准备“室内效果图”的提示词，可在生成前补充户型、风格（如北欧、原木）等要求。',
  },
  architecture: {
    view: 'image',
    aspect: 'landscape',
    prompt:
      '生成一张建筑外观效果图：\n' +
      '- 主体：单个建筑或建筑群，视角自然（略微俯视或仰视均可）\n' +
      '- 风格：现代建筑，线条清晰，玻璃、金属或石材质感真实\n' +
      '- 环境：简洁的城市或自然背景，可有少量绿植或行人烘托比例\n' +
      '- 光影：日间自然光，整体氛围干净专业，适合建筑方案展示\n' +
      '- 不加入过多科幻或奇幻元素，保证可落地的建筑设计感。',
    hint: '已为你准备“建筑效果图”的提示词，可在生成前补充建筑类型（办公楼、住宅等）与风格。',
  },
  'remove-background': {
    view: 'image',
    aspect: 'square',
    prompt:
      '请对用户上传的图片进行专业抠图和背景移除：\n' +
      '- 精确识别主体轮廓，尤其是头发、边缘细节\n' +
      '- 完全移除原有背景及多余杂物，不保留任何阴影或噪点\n' +
      '- 输出透明背景 PNG，适合后续合成和电商主图使用\n' +
      '- 不改变主体的结构、比例和颜色，不新增任何元素。',
    hint: '已为你准备“背景移除”的提示词，请上传需要抠图的图片后再生成。',
  },
  'id-photo': {
    view: 'image',
    aspect: 'portrait',
    prompt:
      '请基于用户上传的人像生成一张标准证件照：\n' +
      '- 尺寸：二寸证件照比例（约 35mm×49mm），画面为胸像\n' +
      '- 背景：纯色背景（常见为蓝色或白色），干净无纹理\n' +
      '- 姿态：正面直视镜头，五官端正，表情自然\n' +
      '- 优化光线与肤色，但不要过度美颜或改变人物特征\n' +
      '- 不添加任何文字、Logo 或边框。',
    hint: '已为你准备“二寸证件照”的提示词，请上传清晰的人像照片后再生成。',
  },
}

const planLabels: Record<string, string> = {
  free: '免费版',
  basic: '基础版',
  professional: '专业版',
  advanced: '高级版',
  enterprise: '企业版',
}

const sidebarIcons = [
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
  { icon: Sparkles, label: '工具', action: 'tools' as const },
  { icon: LayoutDashboard, label: '项目', href: '/generate?view=projects' },
  { icon: Images, label: '画廊', href: '/generate?view=gallery' },
  { icon: MessageCircle, label: '消息', href: '/generate?view=messages' },
]

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
  const settingsTab = searchParams.get('tab') ?? 'overview'
  const isImageView = view === 'image'
  const isVideoView = view === 'video'
  const isChatView = view === 'chat'
  const staticView = staticViewConfigs[view]
  const router = useRouter()
  const { user, logout, loading } = useAuth()

  const [prompt, setPrompt] = useState('')
  const [selectedModel, setSelectedModel] = useState<ModelOption>(isImageView ? '图片' : isVideoView ? '视频' : '自动模式')
  const [selectedAspect, setSelectedAspect] = useState<AspectOption['id']>('portrait')
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [hoveredModel, setHoveredModel] = useState<ModelOption | null>(null)
  const [hoveredSidebarIndex, setHoveredSidebarIndex] = useState<number | null>(null)
  const [isHoveringCreate, setIsHoveringCreate] = useState(false)
  const [navExpanded, setNavExpanded] = useState(false)
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSearchId, setActiveSearchId] = useState<string | null>(null)
  const [hoveredSearchId, setHoveredSearchId] = useState<string | null>(null)
  const [editingSearchId, setEditingSearchId] = useState<string | null>(null)
  const [editSearchTitle, setEditSearchTitle] = useState('')
  const [searchItems, setSearchItems] = useState(flatSearchItems)
  const [geminiPrompt, setGeminiPrompt] = useState('')
  const [geminiAnswer, setGeminiAnswer] = useState<string | null>(null)
  const [geminiRaw, setGeminiRaw] = useState<unknown>(null)
  const [geminiError, setGeminiError] = useState<string | null>(null)
  const [geminiLoading, setGeminiLoading] = useState(false)
  const [geminiSource, setGeminiSource] = useState<string | null>(null)

  // 项目管理状态
  const [projects, setProjects] = useState<any[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const [creatingProject, setCreatingProject] = useState(false)
  const [activeProjectTab, setActiveProjectTab] = useState<'my' | 'shared' | 'examples'>('my')
  const [sharedProjects, setSharedProjects] = useState<any[]>([])


  // 聊天功能相关状态
  type ChatMessage = {
    id: string
    sender: 'user' | 'assistant'
    text: string
    timestamp: string
    status: 'sending' | 'sent' | 'failed'
    images?: string[] // 支持图像消息
  }

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [imageChatMessages, setImageChatMessages] = useState<ChatMessage[]>([])

  // 会话管理相关状态
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [chatSessions, setChatSessions] = useState<Array<{
    id: string
    title: string | null
    updatedAt: string
    lastMessage: string | null
  }>>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)

  // 标记是否已加载，防止初始加载时保存
  const isLoadedRef = useRef(false)
  const isImageLoadedRef = useRef(false)

  // 自动跳转未登录用户到首页 - 只在认证状态加载完成后检查
  useEffect(() => {
    // 等待认证状态加载完成
    if (loading) return

    // 如果用户未登录,跳转到首页
    if (!user) {
      console.log('[Auth] User not authenticated, redirecting to homepage')
      router.push('/')
    }
  }, [user, loading, router])

  // 加载会话列表
  const loadChatSessions = useCallback(async () => {
    console.log('[DEBUG] loadChatSessions called, user:', user)
    if (!user) return
    setIsLoadingSessions(true)
    try {
      console.log('[DEBUG] Fetching /api/chats/list')
      const response = await fetch('/api/chats/list')
      console.log('[DEBUG] loadChatSessions response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('[DEBUG] loadChatSessions data:', data)
        if (data.success) {
          setChatSessions(data.data || [])
        }
      }
    } catch (error) {
      console.error('加载会话列表失败:', error)
    } finally {
      setIsLoadingSessions(false)
    }
  }, [user])

  // 创建新会话
  const createNewChat = useCallback(async () => {
    try {
      const response = await fetch('/api/chats/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: null }),
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const newChatId = data.data.id
          setCurrentChatId(newChatId)
          setChatMessages([])
          await loadChatSessions()
          return newChatId
        }
      }
    } catch (error) {
      console.error('创建新会话失败:', error)
    }
    return null
  }, [loadChatSessions])

  // 加载会话消息
  const loadChatHistory = useCallback(async (chatId: string) => {
    console.log('[DEBUG] loadChatHistory called with chatId:', chatId)
    try {
      console.log('[DEBUG] Fetching /api/chats/' + chatId + '/history')
      const response = await fetch(`/api/chats/${chatId}/history`)
      console.log('[DEBUG] loadChatHistory response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('[DEBUG] loadChatHistory data:', data)
        if (data.success) {
          // 确保消息格式正确，包括图像数据
          const messages = (data.data.messages || []).map((msg: any) => ({
            ...msg,
            images: msg.images || undefined,
          }))
          console.log('[DEBUG] Setting chatMessages, count:', messages.length)
          setChatMessages(messages)
          setCurrentChatId(chatId)
        }
      }
    } catch (error) {
      console.error('加载会话历史失败:', error)
    }
  }, [])

  // 加载图像聊天历史记录
  const loadImageChatHistory = useCallback(async (chatId: string) => {
    console.log('[DEBUG] loadImageChatHistory called with chatId:', chatId)
    try {
      console.log('[DEBUG] Fetching /api/chats/' + chatId + '/history for image view')
      const response = await fetch(`/api/chats/${chatId}/history`)
      console.log('[DEBUG] loadImageChatHistory response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('[DEBUG] loadImageChatHistory data:', data)
        if (data.success) {
          // 确保消息格式正确，包括图像数据
          const messages = (data.data.messages || []).map((msg: any) => ({
            ...msg,
            images: msg.images || undefined,
          }))
          console.log('[DEBUG] Setting imageChatMessages, count:', messages.length)
          // 即使消息为空，也设置空数组（这是正常的，表示会话存在但没有消息）
          setImageChatMessages(messages)
          setCurrentChatId(chatId)
          // 标记已加载，允许保存
          isImageLoadedRef.current = true
        } else {
          // 如果API返回失败（例如会话不存在），清空消息并创建新会话
          console.log('[DEBUG] Failed to load history (API returned failure), creating new chat')
          setImageChatMessages([])
          setCurrentChatId(null)
          const newChatId = await createNewChat()
          if (newChatId) {
            setCurrentChatId(newChatId)
            router.replace(`/generate?view=image&chatId=${newChatId}`)
          }
        }
      } else if (response.status === 404) {
        // 如果会话不存在（404），清空消息并创建新会话
        console.log('[DEBUG] Chat not found (404), creating new chat')
        setImageChatMessages([])
        setCurrentChatId(null)
        const newChatId = await createNewChat()
        if (newChatId) {
          setCurrentChatId(newChatId)
          router.replace(`/generate?view=image&chatId=${newChatId}`)
        }
      } else {
        // 其他错误，只记录错误，不清空消息（可能是网络问题）
        console.error('加载图像聊天历史失败，状态码:', response.status)
      }
    } catch (error) {
      console.error('加载图像聊天历史失败:', error)
      // 网络错误时，不清空消息，保持当前状态
    }
  }, [createNewChat, router])

  // 切换会话
  const switchChat = useCallback(async (chatId: string) => {
    console.log('[DEBUG] switchChat called with chatId:', chatId)
    await loadChatHistory(chatId)
    // 更新URL参数
    router.push(`/generate?view=chat&chatId=${chatId}`)
  }, [loadChatHistory, router])

  // 删除会话
  const handleDeleteChat = useCallback(async (chatId: string, e: React.MouseEvent) => {
    console.log('[DEBUG] handleDeleteChat called with chatId:', chatId)
    e.stopPropagation()
    if (!confirm('确定要删除这个会话吗？')) {
      return
    }
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
      })
      console.log('[DEBUG] DELETE response status:', response.status)
      if (!response.ok) {
        throw new Error('删除会话失败')
      }
      // 如果删除的是当前会话，清空消息
      if (chatId === currentChatId) {
        setChatMessages([])
        setCurrentChatId(null)
        router.push('/generate?view=chat')
      }
      // 刷新会话列表
      await loadChatSessions()
    } catch (error) {
      console.error('删除会话失败:', error)
    }
  }, [currentChatId, loadChatSessions, router])

  // 初始化：加载会话列表，如果没有当前会话则创建新会话
  useEffect(() => {
    console.log('[DEBUG] useEffect triggered, isChatView:', isChatView, 'isImageView:', isImageView, 'user:', user)
    if ((isChatView || isImageView) && user) {
      console.log('[DEBUG] Calling loadChatSessions')
      loadChatSessions()

      // 图像视图：检查URL参数中是否有chatId
      if (isImageView) {
        const urlParams = new URLSearchParams(window.location.search)
        const chatIdFromUrl = urlParams.get('chatId')
        console.log('[DEBUG] Image view - chatIdFromUrl:', chatIdFromUrl, 'currentChatId:', currentChatId, 'imageChatMessages.length:', imageChatMessages.length)

        if (chatIdFromUrl) {
          // URL中有chatId，加载历史记录
          if (chatIdFromUrl !== currentChatId || imageChatMessages.length === 0) {
            // 如果chatId不同，或者当前消息为空，加载历史记录
            console.log('[DEBUG] Loading image chat history for chatId:', chatIdFromUrl)
            loadImageChatHistory(chatIdFromUrl)
          }
        } else {
          // 如果没有chatId，不自动创建新会话
          // 只在用户发送第一条消息时创建新会话（在handleSendMessage中处理）
          console.log('[DEBUG] No chatId in URL, waiting for user to send first message')
          // 清空当前状态，但不创建新会话
          setCurrentChatId(null)
          setImageChatMessages([])
          // 清空 localStorage 中的图像聊天消息
          if (typeof window !== 'undefined') {
            localStorage.removeItem('imageChatMessages')
          }
        }
        return
      }

      // 聊天视图：检查URL参数中是否有chatId
      if (isChatView) {
        const urlParams = new URLSearchParams(window.location.search)
        const chatIdFromUrl = urlParams.get('chatId')
        console.log('[DEBUG] chatIdFromUrl:', chatIdFromUrl, 'currentChatId:', currentChatId)
        if (chatIdFromUrl && chatIdFromUrl !== currentChatId) {
          // URL中有chatId且与当前不同，加载历史记录
          console.log('[DEBUG] Calling loadChatHistory with chatIdFromUrl:', chatIdFromUrl)
          loadChatHistory(chatIdFromUrl)
        }
        // 如果没有chatId，不自动创建新会话，让用户主动选择或创建
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChatView, isImageView, user])

  // 监听URL参数变化，当chatId变化时加载历史记录
  useEffect(() => {
    if ((isChatView || isImageView) && user) {
      const urlParams = new URLSearchParams(window.location.search)
      const chatIdFromUrl = urlParams.get('chatId')
      console.log('[DEBUG] URL chatId changed:', chatIdFromUrl, 'currentChatId:', currentChatId, 'isImageView:', isImageView, 'imageChatMessages.length:', imageChatMessages.length)

      if (chatIdFromUrl) {
        if (isImageView) {
          // 如果chatId不同，或者当前消息为空，加载历史记录
          if (chatIdFromUrl !== currentChatId || imageChatMessages.length === 0) {
            console.log('[DEBUG] URL chatId changed in image view, loading image chat history for:', chatIdFromUrl)
            loadImageChatHistory(chatIdFromUrl)
          }
        } else if (isChatView) {
          if (chatIdFromUrl !== currentChatId) {
            console.log('[DEBUG] URL chatId changed, loading history for:', chatIdFromUrl)
            loadChatHistory(chatIdFromUrl)
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isChatView, isImageView, user])

  // 图像视图不再从 localStorage 加载旧消息
  // 每次打开图像视图都会创建新会话，显示空白窗口
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 只在非图像视图时初始化标记
      if (!isImageView) {
        isImageLoadedRef.current = true
      }
    }
  }, [isImageView])

  // 保存聊天记录到 localStorage（仅在加载完成后）
  useEffect(() => {
    if (typeof window !== 'undefined' && isLoadedRef.current && chatMessages.length > 0) {
      try {
        // 过滤掉发送中的消息和欢迎消息再保存
        const toSave = chatMessages.filter(
          (msg) => msg.status !== 'sending' && msg.id !== 'welcome'
        )
        if (toSave.length > 0) {
          localStorage.setItem('chatMessages', JSON.stringify(toSave))
        } else {
          // 如果没有有效消息，清除 localStorage
          localStorage.removeItem('chatMessages')
        }
      } catch (e) {
        console.error('Failed to save chat messages to localStorage:', e)
      }
    }
  }, [chatMessages])

  useEffect(() => {
    if (typeof window !== 'undefined' && isImageLoadedRef.current && imageChatMessages.length > 0) {
      try {
        // 过滤掉发送中的消息和欢迎消息再保存
        const toSave = imageChatMessages.filter(
          (msg) => msg.status !== 'sending' && msg.id !== 'welcome-image'
        )
        if (toSave.length > 0) {
          localStorage.setItem('imageChatMessages', JSON.stringify(toSave))
        } else {
          // 如果没有有效消息，清除 localStorage
          localStorage.removeItem('imageChatMessages')
        }
      } catch (e) {
        console.error('Failed to save image chat messages to localStorage:', e)
      }
    }
  }, [imageChatMessages])

  // 项目管理函数
  const loadProjects = useCallback(async () => {
    try {
      setProjectsLoading(true)
      const response = await fetch('/api/projects')
      const data = await response.json()
      if (data.success) {
        setProjects(data.data || [])
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setProjectsLoading(false)
    }
  }, [])

  const handleCreateProject = useCallback(async () => {
    if (!newProjectName.trim()) {
      toast.error('请输入项目名称')
      return
    }

    setCreatingProject(true)
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName.trim(),
          description: newProjectDesc.trim() || undefined
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success('项目创建成功')
        setShowCreateProjectModal(false)
        setNewProjectName('')
        setNewProjectDesc('')
        loadProjects()
      } else {
        toast.error(data.error || '创建失败')
      }
    } catch (error) {
      toast.error('创建失败')
    } finally {
      setCreatingProject(false)
    }
  }, [newProjectName, newProjectDesc, loadProjects])

  // 当视图为projects且用户已登录时加载项目
  useEffect(() => {
    if ((view === 'projects' || view === 'tasks') && user) {
      loadProjects()
    }
  }, [view, user, loadProjects])

  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const imageChatContainerRef = useRef<HTMLDivElement>(null)

  const modelOptions: ModelOption[] = isImageView ? ['图片'] : isVideoView ? ['视频'] : ['自动模式', '快速模式', '专家模式']
  const modelMenuRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const feedbackTypeDropdownRef = useRef<HTMLDivElement>(null)
  const isGeminiTest = view === 'gemini-test'
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [userAvatarHovered, setUserAvatarHovered] = useState(false)
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
  const [feedbackType, setFeedbackType] = useState<string>('')
  const [feedbackContent, setFeedbackContent] = useState('')
  const [feedbackTypeDropdownOpen, setFeedbackTypeDropdownOpen] = useState(false)
  const [aiToolsSidebarOpen, setAiToolsSidebarOpen] = useState(false)
  const [selectedAITool, setSelectedAITool] = useState<AITool | null>(null)
  const [tasksTab, setTasksTab] = useState<'my' | 'done' | 'archived'>('my')
  const [messagesTab, setMessagesTab] = useState<'system' | 'team' | 'invite'>('system')

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffHours < 24) return `${diffHours}小时前`
    if (diffDays < 7) return `${diffDays}天前`

    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${month}月${day}日`
  }

  // 将聊天会话按时间分组
  const groupedChatSessions = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thisYear = new Date(now.getFullYear(), 0, 1)

    const groups: {
      section: string
      items: Array<{
        id: string
        title: string
        subtitle: string
        chatId: string
        updatedAt: string
      }>
    }[] = [
        { section: '今天', items: [] },
        { section: '最近7天', items: [] },
        { section: '本年度', items: [] },
      ]

    chatSessions.forEach((session) => {
      const updatedAt = new Date(session.updatedAt)
      const item = {
        id: session.id,
        title: session.title || '新对话',
        subtitle: session.lastMessage || formatTime(session.updatedAt),
        chatId: session.id,
        updatedAt: session.updatedAt,
      }

      if (updatedAt >= today) {
        groups[0].items.push(item)
      } else if (updatedAt >= sevenDaysAgo) {
        groups[1].items.push(item)
      } else if (updatedAt >= thisYear) {
        groups[2].items.push(item)
      }
    })

    // 按更新时间倒序排序每个分组
    groups.forEach((group) => {
      group.items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    })

    return groups.filter((group) => group.items.length > 0)
  }, [chatSessions])

  // 将分组后的会话展平为搜索项格式（用于搜索过滤）
  const chatSessionsAsSearchItems = useMemo(() => {
    return groupedChatSessions.flatMap((group) =>
      group.items.map((item) => ({
        ...item,
        section: group.section,
      }))
    )
  }, [groupedChatSessions])

  const filteredSearchItems = useMemo(() => {
    // 在搜索窗口中显示聊天会话列表
    const itemsToSearch = chatSessionsAsSearchItems
    if (!searchQuery.trim()) return itemsToSearch
    return itemsToSearch.filter((item) =>
      item.title.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      item.subtitle?.toLowerCase().includes(searchQuery.trim().toLowerCase())
    )
  }, [searchQuery, chatSessionsAsSearchItems])

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

  // 存储选中会话的消息
  const [selectedChatMessages, setSelectedChatMessages] = useState<any[]>([])
  const [loadingChatMessages, setLoadingChatMessages] = useState(false)

  const previewSearchItem = useMemo(() => {
    const item = filteredSearchItems.find((item) => item.id === (hoveredSearchId || activeSearchId)) || null
    return item
  }, [hoveredSearchId, activeSearchId, filteredSearchItems])

  // 当选中会话变化时，加载该会话的消息
  useEffect(() => {
    const chatId = previewSearchItem?.chatId
    if (chatId && searchOverlayOpen) {
      setLoadingChatMessages(true)
      fetch(`/api/chats/${chatId}/history`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setSelectedChatMessages(data.data.messages || [])
          }
        })
        .catch((error) => {
          console.error('加载会话消息失败:', error)
          setSelectedChatMessages([])
        })
        .finally(() => {
          setLoadingChatMessages(false)
        })
    } else {
      setSelectedChatMessages([])
    }
  }, [previewSearchItem?.chatId, searchOverlayOpen])

  const handleRenameSearchItem = async (id: string, newTitle: string) => {
    if (!newTitle.trim()) return
    // 如果是聊天会话，更新会话标题
    const session = chatSessions.find((s) => s.id === id)
    if (session) {
      try {
        const response = await fetch(`/api/chats/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newTitle.trim() }),
        })
        if (response.ok) {
          await loadChatSessions()
        }
      } catch (error) {
        console.error('重命名会话失败:', error)
      }
    }
    setEditingSearchId(null)
    setEditSearchTitle('')
  }

  const handleDeleteSearchItem = (id: string) => {
    setSearchItems((prev) => prev.filter((item) => item.id !== id))
    if (activeSearchId === id) {
      setActiveSearchId(null)
    }
  }

  const handleStartRename = useCallback((id: string, currentTitle: string) => {
    setEditingSearchId(id)
    setEditSearchTitle(currentTitle)
  }, [])


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) {
        setModelMenuOpen(false)
        setHoveredModel(null)
      }
    }

    if (modelMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [modelMenuOpen])

  useEffect(() => {
    setSelectedModel(isImageView ? '图片' : isVideoView ? '视频' : '自动模式')
    if (isImageView || isVideoView) {
      setSelectedAspect('portrait')
    }
  }, [isImageView, isVideoView])

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
            style={{
              display: 'flex',
              gap: '20px',
              marginTop: '16px',
              fontSize: '14px',
              color: '#6b7280',
            }}
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

  // 渲染项目页面
  const renderTasksView = () => {
    if (!user) {
      return (
        <div style={{ width: '100%', maxWidth: '760px', padding: '80px 24px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '18px', border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '16px' }}>请先登录以查看项目。</p>
          <Link href="/" style={{ padding: '10px 22px', borderRadius: '999px', backgroundColor: '#1A73E8', color: '#ffffff', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
            去登录
          </Link>
        </div>
      )
    }

    return (
      <div style={{ width: '100%', maxWidth: '1200px', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#0f1419', margin: 0 }}>我的项目</h1>
            <p style={{ fontSize: '15px', color: '#536471', marginTop: '8px', margin: 0 }}>
              组织和管理您的创作内容
            </p>
          </div>
          <button
            onClick={() => setShowCreateProjectModal(true)}
            style={{
              padding: '12px 24px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: '#1d9bf0',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1a8cd8'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1d9bf0'}
          >
            <Plus size={18} />
            新建项目
          </button>
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid #eff3f4', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '32px' }}>
            <button
              onClick={() => setActiveProjectTab('my')}
              style={{
                padding: '16px 0',
                border: 'none',
                background: 'none',
                fontSize: '15px',
                fontWeight: 700,
                color: activeProjectTab === 'my' ? '#0f1419' : '#536471',
                cursor: 'pointer',
                borderBottom: activeProjectTab === 'my' ? '4px solid #1d9bf0' : '4px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              我的项目
            </button>
            <button
              onClick={() => setActiveProjectTab('shared')}
              style={{
                padding: '16px 0',
                border: 'none',
                background: 'none',
                fontSize: '15px',
                fontWeight: 700,
                color: activeProjectTab === 'shared' ? '#0f1419' : '#536471',
                cursor: 'pointer',
                borderBottom: activeProjectTab === 'shared' ? '4px solid #1d9bf0' : '4px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              与我共享
            </button>
            <button
              onClick={() => setActiveProjectTab('examples')}
              style={{
                padding: '16px 0',
                border: 'none',
                background: 'none',
                fontSize: '15px',
                fontWeight: 700,
                color: activeProjectTab === 'examples' ? '#0f1419' : '#536471',
                cursor: 'pointer',
                borderBottom: activeProjectTab === 'examples' ? '4px solid #1d9bf0' : '4px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              示例
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeProjectTab === 'my' && (
          <div>
            {projectsLoading ? (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: '#1d9bf0' }} />
              </div>
            ) : projects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 24px', backgroundColor: '#f7f9f9', borderRadius: '16px', border: '2px dashed #cfd9de' }}>
                <LayoutDashboard size={56} style={{ color: '#aab8c2', margin: '0 auto 24px' }} />
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f1419', marginBottom: '12px' }}>
                  还没有项目
                </h3>
                <p style={{ fontSize: '15px', color: '#536471', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
                  创建您的第一个项目来组织和管理创作内容
                </p>
                <button
                  onClick={() => setShowCreateProjectModal(true)}
                  style={{
                    padding: '12px 32px',
                    borderRadius: '9999px',
                    border: 'none',
                    backgroundColor: '#1d9bf0',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  创建第一个项目
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {projects.map((project) => (
                  <a
                    key={project.id}
                    href={`/projects/${project.id}`}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                      border: '1px solid #eff3f4',
                      padding: '20px',
                      textDecoration: 'none',
                      display: 'block',
                      transition: 'all 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#1d9bf0'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(29, 155, 240, 0.15)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#eff3f4'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '32px' }}>{project.icon || '📦'}</span>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f1419', margin: 0, flex: 1 }}>
                        {project.name}
                      </h3>
                    </div>
                    {project.description && (
                      <p style={{ fontSize: '14px', color: '#536471', marginBottom: '16px', lineHeight: '1.5' }}>
                        {project.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#aab8c2' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={14} />
                        {project._count?.files || 0} 文件
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={14} />
                        {project._count?.generations || 0} 生成
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {activeProjectTab === 'shared' && (
          <div style={{ textAlign: 'center', padding: '80px 24px', backgroundColor: '#f7f9f9', borderRadius: '16px' }}>
            <Users size={56} style={{ color: '#aab8c2', margin: '0 auto 24px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f1419', marginBottom: '12px' }}>
              没有共享项目
            </h3>
            <p style={{ fontSize: '15px', color: '#536471', maxWidth: '400px', margin: '0 auto' }}>
              当有人与您共享项目时，它将显示在这里
            </p>
          </div>
        )}

        {activeProjectTab === 'examples' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {[
              { icon: '⚖️', name: '法律文件审查', desc: '获取美国法律文件的专业分析' },
              { icon: '📝', name: '求职信撰写', desc: '撰写符合职位要求的定制求职信，突出您的经验与技能' },
              { icon: '📄', name: '写作助手', desc: '优化任何文本的清晰度、简洁性和风格' },
              { icon: '💪', name: '健身建议', desc: '基于循证指导规划锻炼、营养和健身目标' },
              { icon: '💻', name: '代码审查', desc: '审查代码的最佳实践、错误和改进建议' },
              { icon: '🌍', name: '语言导师', desc: '练习任何语言的对话并获得纠正' },
              { icon: '🔬', name: '研究助手', desc: '帮助整理研究、总结论文和追踪来源' },
              { icon: '✍️', name: '创意写作伙伴', desc: '头脑风暴创意、发展角色并完善您的故事' }
            ].map((example, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #eff3f4',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#1d9bf0'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(29, 155, 240, 0.15)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#eff3f4'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '32px' }}>{example.icon}</span>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f1419', margin: 0 }}>
                      {example.name}
                    </h3>
                    <span style={{ fontSize: '12px', color: '#aab8c2', fontWeight: 600 }}>示例</span>
                  </div>
                </div>
                <p style={{ fontSize: '14px', color: '#536471', lineHeight: '1.5', margin: 0 }}>
                  {example.desc}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Create Project Modal */}
        {showCreateProjectModal && (
          <div
            onClick={() => setShowCreateProjectModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(91, 112, 131, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '32px',
                width: '100%',
                maxWidth: '600px',
                margin: '0 20px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
              }}
            >
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f1419', marginBottom: '24px' }}>
                创建新项目
              </h2>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '15px', fontWeight: 600, color: '#0f1419', marginBottom: '8px' }}>
                  项目名称 *
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="输入项目名称"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #cfd9de',
                    borderRadius: '8px',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#1d9bf0'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#cfd9de'}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '15px', fontWeight: 600, color: '#0f1419', marginBottom: '8px' }}>
                  项目描述
                </label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="描述这个项目的用途（可选）"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #cfd9de',
                    borderRadius: '8px',
                    fontSize: '15px',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#1d9bf0'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#cfd9de'}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  onClick={() => setShowCreateProjectModal(false)}
                  disabled={creatingProject}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '9999px',
                    border: '1px solid #cfd9de',
                    backgroundColor: '#ffffff',
                    color: '#0f1419',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: creatingProject ? 'not-allowed' : 'pointer',
                    opacity: creatingProject ? 0.6 : 1
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={creatingProject || !newProjectName.trim()}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '9999px',
                    border: 'none',
                    backgroundColor: creatingProject || !newProjectName.trim() ? '#aab8c2' : '#1d9bf0',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: creatingProject || !newProjectName.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {creatingProject && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                  {creatingProject ? '创建中...' : '创建'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }



  // 渲染文件页面
  const renderFilesView = () => {
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
          <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '16px' }}>请先登录以查看文件。</p>
          <Link
            href="/"
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

    return (
      <div style={{ width: '100%', maxWidth: '760px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#111827', margin: 0 }}>文件</h1>
            <nav
              style={{
                display: 'flex',
                gap: '20px',
                marginTop: '16px',
                fontSize: '14px',
                color: '#6b7280',
              }}
            >
              <span style={{ color: '#111827', fontWeight: 600, paddingBottom: '6px', borderBottom: '2px solid #111827' }}>我的文件</span>
              <span>共享文件</span>
              <span>最近上传</span>
            </nav>
          </div>
          <button
            onClick={() => {
              // 上传文件
              toast.success('文件上传功能开发中')
            }}
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
            <UploadCloud style={{ width: '16px', height: '16px' }} />
            上传文件
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
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', margin: 0, marginBottom: '24px' }}>我的文件</h2>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div
              style={{
                padding: '20px',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                backgroundColor: '#F9FAFB',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <Tag style={{ width: '24px', height: '24px', color: '#1A73E8', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                  文件管理功能
                </div>
                <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6, margin: 0 }}>
                  文件功能正在开发中。您可以在这里上传、管理和分享您的文件。
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  // 渲染帮助页面
  const renderHelpView = () => {
    return (
      <div style={{ width: '100%', maxWidth: '760px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <header>
          <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#111827', margin: 0 }}>帮助</h1>
          <nav
            style={{
              display: 'flex',
              gap: '20px',
              marginTop: '16px',
              fontSize: '14px',
              color: '#6b7280',
            }}
          >
            <span style={{ color: '#111827', fontWeight: 600, paddingBottom: '6px', borderBottom: '2px solid #111827' }}>入门指南</span>
            <span>常见问题</span>
            <span>联系我们</span>
          </nav>
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
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', margin: 0, marginBottom: '24px' }}>快速上手</h2>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div
              style={{
                padding: '20px',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                backgroundColor: '#F9FAFB',
              }}
            >
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                如何开始使用 AI Pic Center？
              </div>
              <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6, margin: 0 }}>
                注册账号后，您可以在"生成"页面输入提示词来生成图像或视频。使用信用点来支付生成费用。
              </p>
            </div>
            <div
              style={{
                padding: '20px',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                backgroundColor: '#F9FAFB',
              }}
            >
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                如何获取更多信用点？
              </div>
              <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6, margin: 0 }}>
                您可以在"升级套餐"页面购买订阅计划或单独充值信用点。不同套餐提供不同的信用点额度。
              </p>
            </div>
            <div
              style={{
                padding: '20px',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                backgroundColor: '#F9FAFB',
              }}
            >
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                如何联系客服？
              </div>
              <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6, margin: 0 }}>
                您可以发送邮件至 <a href="mailto:service@aipiccenter.com" style={{ color: '#1A73E8', textDecoration: 'none' }}>service@aipiccenter.com</a>，我们的客服团队会在24小时内回复您。
              </p>
            </div>
          </div>
        </section>

        <section
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)',
            padding: '32px 36px 36px',
          }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', margin: 0, marginBottom: '24px' }}>常见问题</h2>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div
              style={{
                padding: '20px',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                backgroundColor: '#F9FAFB',
              }}
            >
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                生成的图像可以商用吗？
              </div>
              <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6, margin: 0 }}>
                是的，您生成的图像可以用于商业用途。但请注意遵守相关法律法规和平台使用条款。
              </p>
            </div>
            <div
              style={{
                padding: '20px',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                backgroundColor: '#F9FAFB',
              }}
            >
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                信用点会过期吗？
              </div>
              <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6, margin: 0 }}>
                订阅套餐赠送的信用点会在订阅到期时失效。单独购买的信用点永久有效。
              </p>
            </div>
          </div>
        </section>
      </div>
    )
  }

  const renderMessagesView = () => {
    const config = staticViewConfigs.messages

    const currentSectionTitle =
      messagesTab === 'system' ? '系统通知' : messagesTab === 'team' ? '团队提醒' : '协作邀请'

    const emptyText =
      messagesTab === 'system'
        ? '当前没有新的系统通知。系统更新、套餐变更等信息会显示在这里。'
        : messagesTab === 'team'
          ? '当前没有新的团队提醒。团队成员的任务提醒和项目动态会显示在这里。'
          : '当前没有新的协作邀请。有人邀请你加入项目或团队时，会显示在这里。'

    return (
      <div
        style={{
          width: '100%',
          maxWidth: '760px',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
        }}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#111827', margin: 0 }}>{config.title}</h1>
            <nav
              style={{
                display: 'flex',
                gap: '20px',
                marginTop: '16px',
                fontSize: '14px',
                color: '#6b7280',
              }}
            >
              <button
                type="button"
                onClick={() => setMessagesTab('system')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: messagesTab === 'system' ? '#111827' : '#6b7280',
                  fontWeight: messagesTab === 'system' ? 600 : 400,
                  paddingBottom: '6px',
                  borderBottom: messagesTab === 'system' ? '2px solid #111827' : '2px solid transparent',
                }}
              >
                系统通知
              </button>
              <button
                type="button"
                onClick={() => setMessagesTab('team')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: messagesTab === 'team' ? '#111827' : '#6b7280',
                  fontWeight: messagesTab === 'team' ? 600 : 400,
                  paddingBottom: '6px',
                  borderBottom: messagesTab === 'team' ? '2px solid #111827' : '2px solid transparent',
                }}
              >
                团队提醒
              </button>
              <button
                type="button"
                onClick={() => setMessagesTab('invite')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: messagesTab === 'invite' ? '#111827' : '#6b7280',
                  fontWeight: messagesTab === 'invite' ? 600 : 400,
                  paddingBottom: '6px',
                  borderBottom: messagesTab === 'invite' ? '2px solid #111827' : '2px solid transparent',
                }}
              >
                协作邀请
              </button>
            </nav>
          </div>
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
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', margin: 0, marginBottom: '16px' }}>
            {currentSectionTitle}
          </h2>
          <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: 1.7, margin: 0 }}>{emptyText}</p>
        </section>
      </div>
    )
  }

  // 渲染升级套餐页面
  const renderSubscriptionView = () => {
    if (!user) {
      return (
        <div
          style={{
            width: '100%',
            maxWidth: '800px',
            padding: '120px 24px',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
          }}
        >
          <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>订阅管理</h2>
          <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '24px' }}>请先登录以查看和管理您的订阅套餐。</p>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              borderRadius: '8px',
              backgroundColor: '#111827',
              color: '#ffffff',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1f2937'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#111827'
            }}
          >
            立即登录
          </Link>
        </div>
      )
    }

    const planLabel = planLabels[user.plan] ?? (user.plan || '免费版')
    const planExpire = user.planExpiresAt ? new Date(user.planExpiresAt).toLocaleDateString('zh-CN') : '长期有效'
    const isEnterprise = user.plan === 'enterprise'

    const plans = [
      {
        label: '入门版',
        monthlyPrice: 112,
        originalMonthlyPrice: 133,
        yearlyPrice: 1344,
        monthlySave: 21,
        computePower: 2000,
        firstPurchaseBonus: 2000,
        features: [
          '每日获得 100 AI 能力积分',
          '访问所有图像生成能力：提供写实风格、国潮风、手绘插画、写意水墨、动漫风格等多模型支持',
          '访问所有视频生成能力：支持文本生成视频、图片生成视频、动态场景合成、运镜控制',
          '商用授权',
          '支持元素编辑、局部重绘、画质增强',
        ],
      },
      {
        label: '基础版',
        monthlyPrice: 189,
        originalMonthlyPrice: 224,
        yearlyPrice: 2268,
        monthlySave: 35,
        computePower: 3500,
        firstPurchaseBonus: 3500,
        features: [
          '每日获得 100 AI 能力积分',
          '高级图像生成能力：高清写实、电影光效、国风艺术、专业级插画模型',
          '高级视频生成能力：更长时长、更高清晰度、更自然的动作生成',
          '支持图像→视频的时序补帧',
          '商用授权',
          '支持元素编辑与画面调优',
        ],
      },
      {
        label: '专业版',
        monthlyPrice: 518,
        originalMonthlyPrice: 630,
        yearlyPrice: 6216,
        monthlySave: 112,
        computePower: 11000,
        firstPurchaseBonus: 11000,
        features: [
          '每日获得 100 AI 能力积分',
          '全面访问平台所有图像生成模型：多风格、高清晰度、专业级绘画模型',
          '全面访问所有视频生成模型：动态镜头、角色驱动、场景模拟、长视频生成',
          '提供专业级画质修复、模型增强、超分辨率处理',
          '商用授权',
          '支持所有编辑功能',
          '获得充值积分额外赠送优惠',
        ],
      },
      {
        label: '旗舰版',
        monthlyPrice: 1162,
        originalMonthlyPrice: 1393,
        yearlyPrice: 13944,
        monthlySave: 231,
        computePower: 27000,
        firstPurchaseBonus: 27000,
        features: [
          '每日获得 100 AI 能力积分',
          '顶级图像生成能力：高分辨率、多风格融合、艺术级渲染模型',
          '顶级视频生成能力：电影级动态、复杂动作连贯、长时序生成、镜头调度',
          '企业级画质增强、视频修复、专业后期处理',
          '商用授权',
          '所有编辑能力全量开放',
          '充值积分享受 9 折优惠',
        ],
      },
    ]

    return (
      <div style={{ width: '100%', maxWidth: '1400px', display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '100px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '96px', fontWeight: 700, color: '#111827', margin: 0, marginBottom: '24px' }}>订阅计划与价格</h1>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '4px' }}>
            <button
              onClick={() => setBillingPeriod('monthly')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: billingPeriod === 'monthly' ? '#111827' : 'transparent',
                color: billingPeriod === 'monthly' ? '#ffffff' : '#6b7280',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              月付
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: billingPeriod === 'yearly' ? '#111827' : 'transparent',
                color: billingPeriod === 'yearly' ? '#ffffff' : '#6b7280',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              年付 免费2个月
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {plans.map((plan) => {
            const currentPrice = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice / 12
            const originalPrice = billingPeriod === 'monthly' ? plan.originalMonthlyPrice : plan.originalMonthlyPrice
            const saveAmount = billingPeriod === 'monthly' ? plan.monthlySave : plan.monthlySave * 12

            return (
              <div
                key={plan.label}
                style={{
                  padding: '24px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Plan Label */}
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      backgroundColor: '#f3f4f6',
                      color: '#111827',
                      fontSize: '14px',
                      fontWeight: 600,
                      width: 'fit-content',
                    }}
                  >
                    {plan.label}
                  </div>
                </div>

                {/* Price */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '32px', fontWeight: 700, color: '#111827' }}>
                      ￥{billingPeriod === 'monthly' ? plan.monthlyPrice : Math.round(plan.yearlyPrice / 12)}
                    </span>
                    {billingPeriod === 'monthly' && (
                      <>
                        <span style={{ fontSize: '12px', color: '#111827', fontWeight: 600 }}>每月节省￥{plan.monthlySave}</span>
                        <span style={{ fontSize: '14px', color: '#6b7280', textDecoration: 'line-through' }}>
                          /月 ￥{plan.originalMonthlyPrice}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Compute Power */}
                <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '14px', color: '#111827', marginBottom: '8px' }}>
                    每月{plan.computePower}积分
                  </div>
                  <div style={{ fontSize: '13px', color: '#111827' }}>
                    首购额外{plan.firstPurchaseBonus}积分
                    <span
                      style={{
                        marginLeft: '6px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      限时优惠
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div style={{ flex: 1, marginBottom: '20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>
                    功能特色
                  </div>
                  <div style={{ fontSize: '13px', color: '#111827', lineHeight: '1.8' }}>
                    {plan.features.map((feature, idx) => {
                      if (typeof feature === 'string') {
                        return (
                          <div key={idx} style={{ marginBottom: '6px', display: 'flex', alignItems: 'flex-start' }}>
                            <span style={{ color: '#111827', marginRight: '8px', flexShrink: 0, marginTop: '2px' }}>✓</span>
                            <span style={{ flex: 1 }}>{feature}</span>
                          </div>
                        )
                      } else {
                        return (
                          <div key={idx} style={{ marginBottom: '6px', display: 'flex', alignItems: 'flex-start' }}>
                            <span style={{ color: '#111827', marginRight: '8px', flexShrink: 0, marginTop: '2px' }}>✓</span>
                            <span style={{ flex: 1 }}>{feature.text}</span>
                          </div>
                        )
                      }
                    })}
                  </div>
                </div>

                {/* Upgrade Button */}
                <button
                  style={{
                    width: '100%',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#f3f4f6',
                    color: '#111827',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e5e7eb'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6'
                  }}
                >
                  升级
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

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
            href="/"
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

    // 根据不同的 tab 渲染不同的内容
    const renderSettingsContent = () => {
      switch (settingsTab) {
        case 'subscription':
          return (
            <section
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '18px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)',
                padding: '32px 36px 36px',
              }}
            >
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', margin: 0, marginBottom: '24px' }}>订阅权益</h2>
              <div
                style={{
                  padding: '24px',
                  border: '2px solid #1A73E8',
                  borderRadius: '12px',
                  backgroundColor: '#EEF2FF',
                  marginBottom: '24px',
                }}
              >
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>
                  当前套餐：{planLabel}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                  有效期至：{planExpire}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  当前信用点：{user.credits} 点
                </div>
              </div>
              <Link
                href="/pricing"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  borderRadius: '999px',
                  backgroundColor: '#1A73E8',
                  color: '#ffffff',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                升级套餐
              </Link>
            </section>
          )
        case 'security':
          return (
            <section
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '18px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)',
                padding: '32px 36px 36px',
              }}
            >
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', margin: 0, marginBottom: '24px' }}>安全设置</h2>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div
                  style={{
                    padding: '20px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    backgroundColor: '#F9FAFB',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                      登录手机号
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      {user.phone}
                    </div>
                  </div>
                  <button
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#ffffff',
                      color: '#111827',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                    onClick={() => toast.success('修改手机号功能开发中')}
                  >
                    修改
                  </button>
                </div>
                <div
                  style={{
                    padding: '20px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    backgroundColor: '#F9FAFB',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                      账户安全
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      使用验证码登录，无需密码
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: '#16A34A', fontWeight: 600 }}>
                    已启用
                  </div>
                </div>
              </div>
            </section>
          )
        case 'preferences':
          return (
            <section
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '18px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)',
                padding: '32px 36px 36px',
              }}
            >
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', margin: 0, marginBottom: '24px' }}>偏好设置</h2>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div
                  style={{
                    padding: '20px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    backgroundColor: '#F9FAFB',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                      默认生成模式
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      选择默认的图像生成模式
                    </div>
                  </div>
                  <select
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#ffffff',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                    defaultValue="auto"
                    onChange={(e) => toast.success(`已设置为：${e.target.value}`)}
                  >
                    <option value="auto">自动模式</option>
                    <option value="fast">快速模式</option>
                    <option value="expert">专家模式</option>
                  </select>
                </div>
                <div
                  style={{
                    padding: '20px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    backgroundColor: '#F9FAFB',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                      邮件通知
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      接收重要通知和更新
                    </div>
                  </div>
                  <label
                    style={{
                      position: 'relative',
                      display: 'inline-block',
                      width: '44px',
                      height: '24px',
                    }}
                  >
                    <input
                      type="checkbox"
                      defaultChecked
                      style={{
                        opacity: 0,
                        width: 0,
                        height: 0,
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        cursor: 'pointer',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: '#1A73E8',
                        borderRadius: '24px',
                        transition: '0.3s',
                      }}
                    />
                  </label>
                </div>
              </div>
            </section>
          )
        default: // overview
          return (
            <>
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
                    href="/generate?view=feedback"
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
                    反馈
                  </Link>
                </div>
                <p style={{ fontSize: '13px', color: '#6b7280' }}>
                  如需企业版开通、发票或更多自定义支持，可发送邮件至 <a href="mailto:service@aipiccenter.com" style={{ color: '#1A73E8', textDecoration: 'none' }}>service@aipiccenter.com</a>，我们的客户成功团队会尽快联系您。
                </p>
              </section>
            </>
          )
      }
    }

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
              <span
                style={{
                  color: settingsTab === 'overview' ? '#111827' : '#6b7280',
                  fontWeight: settingsTab === 'overview' ? 600 : 400,
                  paddingBottom: '6px',
                  borderBottom: settingsTab === 'overview' ? '2px solid #111827' : 'none',
                  cursor: 'pointer',
                }}
                onClick={() => router.replace('/generate?view=settings&tab=overview')}
              >
                账户总览
              </span>
              <span
                style={{
                  color: settingsTab === 'subscription' ? '#111827' : '#6b7280',
                  fontWeight: settingsTab === 'subscription' ? 600 : 400,
                  paddingBottom: '6px',
                  borderBottom: settingsTab === 'subscription' ? '2px solid #111827' : 'none',
                  cursor: 'pointer',
                }}
                onClick={() => router.replace('/generate?view=settings&tab=subscription')}
              >
                订阅权益
              </span>
              <span
                style={{
                  color: settingsTab === 'security' ? '#111827' : '#6b7280',
                  fontWeight: settingsTab === 'security' ? 600 : 400,
                  paddingBottom: '6px',
                  borderBottom: settingsTab === 'security' ? '2px solid #111827' : 'none',
                  cursor: 'pointer',
                }}
                onClick={() => router.replace('/generate?view=settings&tab=security')}
              >
                安全设置
              </span>
              <span
                style={{
                  color: settingsTab === 'preferences' ? '#111827' : '#6b7280',
                  fontWeight: settingsTab === 'preferences' ? 600 : 400,
                  paddingBottom: '6px',
                  borderBottom: settingsTab === 'preferences' ? '2px solid #111827' : 'none',
                  cursor: 'pointer',
                }}
                onClick={() => router.replace('/generate?view=settings&tab=preferences')}
              >
                偏好设置
              </span>
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

        {renderSettingsContent()}
      </div>
    )
  }

  useEffect(() => {
    if (!modelMenuOpen) {
      setHoveredModel(null)
    }
  }, [modelMenuOpen])

  useEffect(() => {
    if (!navExpanded) {
      setUserMenuOpen(false)
    }
  }, [navExpanded])

  // 监听路由变化，确保设置页面正确显示
  useEffect(() => {
    if (view === 'settings') {
      // 确保设置页面显示时关闭用户菜单
      setUserMenuOpen(false)
    }
  }, [view])

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
    const handleClickOutside = (event: MouseEvent) => {
      if (
        feedbackTypeDropdownRef.current &&
        !feedbackTypeDropdownRef.current.contains(event.target as Node)
      ) {
        setFeedbackTypeDropdownOpen(false)
      }
    }

    if (feedbackTypeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [feedbackTypeDropdownOpen])

  useEffect(() => {
    const shouldLock = searchOverlayOpen
    document.body.style.overflow = shouldLock ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [searchOverlayOpen])

  // 当 view 变化时关闭 AI 工具侧栏
  useEffect(() => {
    if (view !== 'tools') {
      setAiToolsSidebarOpen(false)
    }
  }, [view])

  // 点击外部区域关闭工具侧栏
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      // 检查点击是否在导航栏内部
      const clickedOnNav = navRef.current && (navRef.current.contains(target) || navRef.current === target)

      // 检查点击是否在侧栏内部（通过查找包含特定类名或样式的元素）
      const sidebarElement = document.querySelector('[data-ai-tools-sidebar]')
      const clickedOnSidebar = sidebarElement && (sidebarElement.contains(target) || sidebarElement === target)

      if (!clickedOnNav && !clickedOnSidebar && aiToolsSidebarOpen) {
        setAiToolsSidebarOpen(false)
      }
    }

    if (aiToolsSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [aiToolsSidebarOpen])

  useEffect(() => {
    if (searchOverlayOpen) {
      setSearchQuery('')
      // 加载会话列表
      if (isChatView && user) {
        void loadChatSessions()
      }
      // 设置第一个会话为选中项
      if (chatSessions.length > 0) {
        setActiveSearchId(chatSessions[0].id)
      }
    }
  }, [searchOverlayOpen, isChatView, user, chatSessions, loadChatSessions])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSearchOverlayOpen(false)
      }
      // Ctrl+E 编辑当前选中的会话
      if ((event.ctrlKey || event.metaKey) && event.key === 'e' && searchOverlayOpen && previewSearchItem) {
        event.preventDefault()
        handleStartRename(previewSearchItem.id, previewSearchItem.title)
      }
      // Ctrl+D 删除当前选中的会话
      if ((event.ctrlKey || event.metaKey) && event.key === 'd' && searchOverlayOpen && previewSearchItem?.chatId) {
        event.preventDefault()
        const fakeEvent = { stopPropagation: () => { } } as React.MouseEvent
        handleDeleteChat(previewSearchItem.chatId, fakeEvent)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [searchOverlayOpen, previewSearchItem, handleStartRename, handleDeleteChat])

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

  // 处理参考文件上传（图片或其他文件），图片会作为参考图显示，其他文件作为附加上下文使用预留
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件大小 (10MB) - 参考文件过大可能影响生成速度，这里先沿用原有限制
    if (file.size > 10 * 1024 * 1024) {
      toast.error('文件大小不能超过10MB')
      return
    }

    setIsUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '上传失败')
      }

      const data = await response.json()
      if (data.success && data.data) {
        // 只有当文件是图片时，才作为参考图片在界面中显示
        if (data.data.mimeType && data.data.mimeType.startsWith('image/')) {
          setReferenceImage(data.data.url)
          toast.success('参考图片上传成功')
        } else {
          // 非图片文件目前作为上下文预留（后端可根据需要读取），前端不展示缩略图以避免破坏布局
          toast.success('参考文件上传成功')
        }
      }
    } catch (error) {
      console.error('上传图片失败:', error)
      toast.error(error instanceof Error ? error.message : '上传图片失败')
    } finally {
      setIsUploadingImage(false)
      if (imageInputRef.current) {
        imageInputRef.current.value = ''
      }
    }
  }

  const handleSendMessage = async () => {
    const trimmed = prompt.trim()
    // 先检查输入是否为空，避免在状态检查时提前返回
    if (!trimmed && !referenceImage) {
      return
    }
    // 检查是否正在处理中
    if (isSendingMessage || isGeneratingImage) {
      return
    }

    // 只在聊天视图和图像视图中处理
    if (!isChatView && !isImageView) {
      return
    }

    // 如果是图像模式，先立即添加用户消息，然后异步检查意图
    if (isImageView) {
      console.log('[Chat] Image view detected')

      // 确保有当前会话
      let chatId = currentChatId
      if (!chatId) {
        chatId = await createNewChat()
        if (!chatId) {
          console.error('无法创建新会话')
          return
        }
        // 创建新会话后，更新 URL 和状态
        setCurrentChatId(chatId)
        router.push(`/generate?view=image&chatId=${chatId}`)
      }

      // 先清空输入框，避免重复提交
      setPrompt('')
      // 设置生成状态，防止重复提交
      setIsGeneratingImage(true)

      // 立即添加用户消息到界面
      const timestamp = new Date().toISOString()
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: trimmed,
        timestamp,
        status: 'sent',
      }

      setImageChatMessages((prev) => [...prev, userMessage])

      // 使用 setTimeout 确保用户消息先显示，然后再处理回复
      setTimeout(() => {
        // 让 Gemini 判断用户意图并处理
        handleImageChatMessage(trimmed, userMessage.id)
      }, 100) // 100ms 延迟，确保用户消息先渲染

      return
    }

    // 确保有当前会话
    let chatId = currentChatId
    if (!chatId) {
      chatId = await createNewChat()
      if (!chatId) {
        console.error('无法创建新会话')
        return
      }
      // 创建新会话后，更新 URL 和状态
      setCurrentChatId(chatId)
      router.push(`/generate?view=chat&chatId=${chatId}`)
    }

    // 聊天模式，继续正常的文本对话流程
    console.log('[Chat] Chat view detected, calling text conversation')

    const timestamp = new Date().toISOString()
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp,
      status: 'sent',
    }

    const placeholderId = `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const placeholderMessage: ChatMessage = {
      id: placeholderId,
      sender: 'assistant',
      text: selectedModel === '专家模式' ? '专家模式思考中…' : '正在思考…',
      timestamp,
      status: 'sending',
    }

    // 构建对话上下文
    const conversationSnapshot = [...chatMessages, userMessage]
      .map((message) => `${message.sender === 'user' ? '用户' : 'Grok'}：${message.text}`)
      .join('\n')

    setChatMessages((prev) => [...prev, userMessage, placeholderMessage])
    setPrompt('')
    setIsSendingMessage(true)

    // 保存用户消息到数据库
    try {
      await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'user',
          content: trimmed,
        }),
      })
    } catch (error) {
      console.error('保存用户消息失败:', error)
    }

    try {
      const response = await fetch('/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt:
            (selectedModel === '专家模式'
              ? '你现在处于专家模式，请用严谨、专业的方式回答。以下是当前对话：\n'
              : '请以友好、易懂的方式回答用户。以下是当前对话：\n') + conversationSnapshot,
          stream: true, // 启用流式响应
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = (errorData as { error?: string })?.error || '服务暂时不可用，请稍后重试。'
        setChatMessages((prev) =>
          prev.map((message) =>
            message.id === placeholderId
              ? {
                ...message,
                text: errorMessage,
                status: 'failed',
                timestamp: new Date().toISOString(),
              }
              : message,
          ),
        )
        return
      }

      // 检查是否是流式响应
      const contentType = response.headers.get('content-type')
      console.log('[Chat] Response content-type:', contentType)

      if (contentType?.includes('text/event-stream')) {
        console.log('[Chat] Using stream response')
        // 流式响应处理
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let accumulatedText = ''

        if (!reader) {
          throw new Error('无法读取流式响应')
        }

        try {
          let readCount = 0
          while (true) {
            const { done, value } = await reader.read()
            readCount++

            if (done) {
              // 流结束，更新最终状态
              console.log('[Chat] Stream finished, read count:', readCount, 'accumulated text length:', accumulatedText.length)
              if (!accumulatedText) {
                console.warn('[Chat] No text received from stream after', readCount, 'reads')
              }
              const finalText = accumulatedText || '（未获取到回复内容，可能是流式响应解析失败）'
              setChatMessages((prev) =>
                prev.map((message) =>
                  message.id === placeholderId
                    ? {
                      ...message,
                      text: finalText,
                      status: 'sent',
                      timestamp: new Date().toISOString(),
                    }
                    : message,
                ),
              )

              // 保存助手回复到数据库
              if (chatId && finalText) {
                try {
                  await fetch(`/api/chats/${chatId}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      role: 'assistant',
                      content: finalText,
                    }),
                  })
                  // 刷新会话列表
                  await loadChatSessions()
                } catch (error) {
                  console.error('保存助手消息失败:', error)
                }
              }

              break
            }

            console.log(`[Chat] Read chunk ${readCount}, value length:`, value?.length || 0, 'value type:', typeof value)

            if (!value || value.length === 0) {
              console.warn('[Chat] Empty chunk received')
              continue
            }

            // 解析流式数据
            const chunk = decoder.decode(value, { stream: true })
            console.log('[Chat] Raw chunk received (first 500 chars):', chunk.substring(0, 500))

            const lines = chunk.split('\n').filter((line) => line.trim() !== '')
            console.log('[Chat] Parsed lines count:', lines.length)

            if (lines.length === 0) {
              console.warn('[Chat] No lines found in chunk')
            }

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const jsonStr = line.slice(6)
                  console.log('[Chat] Parsing data line:', jsonStr.substring(0, 100))
                  const data = JSON.parse(jsonStr)
                  const text = (data as { text?: string })?.text || ''
                  const error = (data as { error?: string })?.error

                  if (text) {
                    accumulatedText += text
                    console.log('[Chat] Received text chunk:', text.substring(0, 50) + '...')
                    // 实时更新消息内容
                    setChatMessages((prev) =>
                      prev.map((message) =>
                        message.id === placeholderId
                          ? {
                            ...message,
                            text: accumulatedText,
                            status: 'sending',
                            timestamp: new Date().toISOString(),
                          }
                          : message,
                      ),
                    )
                  } else if (error && !accumulatedText) {
                    // 如果有错误且没有累积文本，显示错误
                    console.error('[Chat] Stream error:', error)
                    accumulatedText = `错误: ${error}`
                    setChatMessages((prev) =>
                      prev.map((message) =>
                        message.id === placeholderId
                          ? {
                            ...message,
                            text: accumulatedText,
                            status: 'failed',
                            timestamp: new Date().toISOString(),
                          }
                          : message,
                      ),
                    )
                  } else if (!text && !error) {
                    console.warn('[Chat] Empty text in data chunk:', data)
                  }
                } catch (e) {
                  console.error('[Chat] Failed to parse data line:', line.substring(0, 200), e)
                }
              } else if (line.trim()) {
                console.log('[Chat] Non-data line:', line.substring(0, 100))
              }
            }
          }
        } catch (streamError) {
          console.error('流式读取错误:', streamError)
          console.error('已累积的文本:', accumulatedText)
          setChatMessages((prev) =>
            prev.map((message) =>
              message.id === placeholderId
                ? {
                  ...message,
                  text: accumulatedText || `流式读取失败: ${streamError instanceof Error ? streamError.message : '未知错误'}。请检查网络连接或重试。`,
                  status: accumulatedText ? 'sent' : 'failed',
                  timestamp: new Date().toISOString(),
                }
                : message,
            ),
          )
        } finally {
          reader.releaseLock()
        }
      } else {
        // 非流式响应（回退方案）
        const data = await response.json().catch(() => ({}))
        const replyText = (data as { text?: string })?.text?.trim() || '（未获取到回复内容）'
        setChatMessages((prev) =>
          prev.map((message) =>
            message.id === placeholderId
              ? {
                ...message,
                text: replyText,
                status: 'sent',
                timestamp: new Date().toISOString(),
              }
              : message,
          ),
        )

        // 保存助手回复到数据库
        if (chatId && replyText) {
          try {
            await fetch(`/api/chats/${chatId}/messages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                role: 'assistant',
                content: replyText,
              }),
            })
            // 刷新会话列表
            await loadChatSessions()
          } catch (error) {
            console.error('保存助手消息失败:', error)
          }
        }
      }
    } catch (error) {
      console.error('发送消息失败', error)
      setChatMessages((prev) =>
        prev.map((message) =>
          message.id === placeholderId
            ? {
              ...message,
              text: '发送失败，请检查网络后重试。',
              status: 'failed',
              timestamp: new Date().toISOString(),
            }
            : message,
        ),
      )
    } finally {
      setIsSendingMessage(false)
    }
  }

  // 在聊天中处理图像生成
  const handleImageGenerationInChat = useCallback(async (userPrompt: string, chatId: string) => {
    const trimmed = userPrompt.trim()
    if (!trimmed || isGeneratingImage) {
      return
    }

    const timestamp = new Date().toISOString()
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp,
      status: 'sent',
    }

    const placeholderId = `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const placeholderMessage: ChatMessage = {
      id: placeholderId,
      sender: 'assistant',
      text: '正在生成图像…',
      timestamp,
      status: 'sending',
    }

    setChatMessages((prev) => [...prev, userMessage, placeholderMessage])
    setPrompt('')
    setIsGeneratingImage(true)

    // 保存用户消息到数据库
    try {
      await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'user',
          content: trimmed,
        }),
      })
    } catch (error) {
      console.error('保存用户消息失败:', error)
    }

    try {
      // 根据选择的宽高比确定 aspectRatio
      const aspectRatioMap: Record<AspectOption['id'], '1:1' | '3:4' | '4:3' | '9:16' | '16:9'> = {
        square: '1:1',
        portrait: '3:4',
        landscape: '4:3',
      }

      const response = await fetch('/api/image-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          prompt: trimmed,
          aspectRatio: aspectRatioMap[selectedAspect] || '1:1',
          referenceImage: referenceImage || undefined,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.success) {
        const errorMessage = data?.error || '图像生成失败，请稍后再试。'
        setChatMessages((prev) =>
          prev.map((message) =>
            message.id === placeholderId
              ? {
                ...message,
                text: errorMessage,
                status: 'failed',
                timestamp: new Date().toISOString(),
              }
              : message,
          ),
        )
        return
      }

      const images = data.data?.images || []
      const finalMessage: ChatMessage = {
        id: placeholderId,
        sender: 'assistant',
        text: `已为你生成图像：${trimmed}`,
        images,
        timestamp: new Date().toISOString(),
        status: 'sent',
      }

      setChatMessages((prev) =>
        prev.map((message) =>
          message.id === placeholderId ? finalMessage : message,
        ),
      )

      // 保存图像结果到数据库（将图像 URL 保存为 JSON）
      if (chatId && images.length > 0) {
        try {
          await fetch(`/api/chats/${chatId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              role: 'assistant',
              content: `已为你生成图像：${trimmed}`,
              imagePath: JSON.stringify(images), // 将图像数组保存为 JSON 字符串
            }),
          })
          // 刷新会话列表
          await loadChatSessions()
        } catch (error) {
          console.error('保存图像消息失败:', error)
        }
      }
    } catch (error) {
      console.error('生成图像失败', error)
      setChatMessages((prev) =>
        prev.map((message) =>
          message.id === placeholderId
            ? {
              ...message,
              text: '生成失败，请检查网络后重试。',
              status: 'failed',
              timestamp: new Date().toISOString(),
            }
            : message,
        ),
      )
    } finally {
      setIsGeneratingImage(false)
    }
  }, [isGeneratingImage, selectedAspect, loadChatSessions, referenceImage])

  // 图像生成处理函数（直接生成，不检查意图）
  const handleImageGenerationDirect = useCallback(async (userPrompt: string, userMessageId: string) => {
    if (!userPrompt.trim()) {
      setIsGeneratingImage(false)
      return
    }

    const placeholderId = `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const placeholderMessage: ChatMessage = {
      id: placeholderId,
      sender: 'assistant',
      text: '正在生成图像…',
      timestamp: new Date().toISOString(),
      status: 'sending',
    }

    setImageChatMessages((prev) => [...prev, placeholderMessage])

    try {
      // 根据选择的宽高比确定 aspectRatio
      const aspectRatioMap: Record<AspectOption['id'], '1:1' | '3:4' | '4:3' | '9:16' | '16:9'> = {
        square: '1:1',
        portrait: '3:4',
        landscape: '4:3',
      }

      // 如果用户想要其他比例，可以通过对话指定，这里使用默认的

      const response = await fetch('/api/image-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          prompt: userPrompt.trim(),
          aspectRatio: aspectRatioMap[selectedAspect] || '1:1',
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.success) {
        const errorMessage = data?.error || '图像生成失败，请稍后再试。'
        setImageChatMessages((prev) =>
          prev.map((message) =>
            message.id === placeholderId
              ? {
                ...message,
                text: errorMessage,
                status: 'failed',
                timestamp: new Date().toISOString(),
              }
              : message,
          ),
        )
        return
      }

      // 更新消息，显示生成的图像
      const generatedImages = data.data?.images || []
      const imageText = `已为你生成图像：${userPrompt.trim()}`

      setImageChatMessages((prev) =>
        prev.map((message) =>
          message.id === placeholderId
            ? {
              ...message,
              text: imageText,
              images: generatedImages,
              status: 'sent',
              timestamp: new Date().toISOString(),
            }
            : message,
        ),
      )

      // 保存包含图像的消息到数据库
      if (currentChatId && generatedImages.length > 0) {
        try {
          // 将第一个图像URL保存为imagePath，如果有多个图像，可以将它们合并
          const imagePath = generatedImages[0] || ''
          await fetch(`/api/chats/${currentChatId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              role: 'assistant',
              content: imageText,
              imagePath: imagePath,
            }),
          })
        } catch (error) {
          console.error('保存图像消息失败:', error)
        }
      }
    } catch (error) {
      console.error('生成图像失败', error)
      setImageChatMessages((prev) =>
        prev.map((message) =>
          message.id === placeholderId
            ? {
              ...message,
              text: '生成失败，请检查网络后重试。',
              status: 'failed',
              timestamp: new Date().toISOString(),
            }
            : message,
        ),
      )
    } finally {
      setIsGeneratingImage(false)
    }
  }, [selectedAspect, currentChatId])

  // 使用 Gemini 处理图像视图的聊天消息
  // 完全依赖 Gemini 的自主判断，不做任何干预
  // Gemini 可以自由地聊天、询问、确认，也可以决定何时生成图像
  const handleImageChatMessage = useCallback(async (userPrompt: string, userMessageId: string) => {
    const trimmedPrompt = userPrompt.trim()

    if (!trimmedPrompt) {
      setIsGeneratingImage(false)
      return
    }

    // 确保有当前会话
    let chatId = currentChatId
    if (!chatId) {
      chatId = await createNewChat()
      if (!chatId) {
        console.error('无法创建新会话')
        setIsGeneratingImage(false)
        return
      }
      setCurrentChatId(chatId)
      router.push(`/generate?view=image&chatId=${chatId}`)
    }

    // 异步保存用户消息到数据库（不阻塞API调用）
    void fetch(`/api/chats/${chatId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'user',
        content: trimmedPrompt,
      }),
    }).catch((error) => {
      console.error('保存用户消息失败:', error)
    })

    try {
      // 构建对话上下文
      const conversationContext = imageChatMessages
        .slice(-10) // 取最近10条消息作为上下文，让 Gemini 有更多上下文理解
        .map((msg) => `${msg.sender === 'user' ? '用户' : '助手'}: ${msg.text}`)
        .join('\n')

      // 完全自由的系统提示，让 Gemini 100% 自主决策，不做任何格式要求
      const systemPrompt = `你是一个智能助手，可以帮助用户生成图像或进行普通聊天。

你的能力：
- 你可以与用户进行完全自然的对话
- 如果用户想要生成图像，你可以：
  * 询问用户想要生成什么样的图像
  * 确认用户的图像需求
  * 直接为用户生成图像
  * 或者做任何你认为合适的回应
- 如果用户只是在聊天、提问、打招呼等，你可以作为普通聊天助手回复
- 你完全自主决定如何回复用户，包括是否要生成图像、何时生成图像、如何与用户交流等

当前对话上下文：
${conversationContext || '(无)'}

用户输入："${trimmedPrompt}"

请根据你的判断自由回复，完全按照你的理解来处理：`

      const response = await fetch('/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          prompt: systemPrompt,
          stream: true, // 启用流式响应，提升响应速度
        }),
      })

      if (!response.ok) {
        throw new Error('API 调用失败')
      }

      // 检查是否是流式响应
      const contentType = response.headers.get('content-type')
      let geminiReply = ''

      if (contentType?.includes('text/event-stream')) {
        // 流式响应处理
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error('无法读取流式响应')
        }

        // 创建助手消息占位符
        const assistantMessageId = `assistant-${Date.now()}`
        const assistantMessage: ChatMessage = {
          id: assistantMessageId,
          sender: 'assistant',
          text: '',
          timestamp: new Date().toISOString(),
          status: 'sending',
        }

        setImageChatMessages((prev) => [...prev, assistantMessage])

        try {
          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              setIsGeneratingImage(false)
              // 更新消息状态为已发送
              setImageChatMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, status: 'sent' as const }
                    : msg,
                ),
              )

              // 异步保存助手消息到数据库（不阻塞）
              if (chatId && geminiReply) {
                void fetch(`/api/chats/${chatId}/messages`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    role: 'assistant',
                    content: geminiReply,
                  }),
                }).catch((error) => {
                  console.error('保存助手消息失败:', error)
                })
              }

              break
            }

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n').filter((line) => line.trim() !== '')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const jsonStr = line.slice(6)
                  const data = JSON.parse(jsonStr)
                  const text = (data as { text?: string })?.text || ''

                  if (text) {
                    geminiReply += text
                    // 实时更新消息文本
                    setImageChatMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessageId
                          ? { ...msg, text: geminiReply }
                          : msg,
                      ),
                    )
                  }
                } catch (e) {
                  // 忽略解析错误
                }
              }
            }
          }
        } catch (error) {
          console.error('流式响应读取错误:', error)
          setIsGeneratingImage(false)
          setImageChatMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                  ...msg,
                  text: '抱歉，处理您的消息时出现了问题。请稍后再试。',
                  status: 'failed' as const,
                }
                : msg,
            ),
          )
        } finally {
          reader.releaseLock()
        }
      } else {
        // 非流式响应（回退方案）
        const data = await response.json()
        geminiReply = data?.text?.trim() || ''

        setIsGeneratingImage(false)

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: geminiReply || '抱歉，我无法理解您的意思。',
          timestamp: new Date().toISOString(),
          status: 'sent',
        }

        setImageChatMessages((prev) => [...prev, assistantMessage])

        // 异步保存助手消息到数据库（不阻塞）
        if (chatId && geminiReply) {
          void fetch(`/api/chats/${chatId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              role: 'assistant',
              content: geminiReply,
            }),
          }).catch((error) => {
            console.error('保存助手消息失败:', error)
          })
        }
      }

      // 检查 Gemini 的回复中是否明确表达了要生成图像的意图
      // 使用自然语言识别，而不是格式要求
      // 只有当 Gemini 明确表示"我现在为您生成"、"正在生成"等，并且有图像描述时，才调用图像生成
      const generateIntentPatterns = [
        /(?:我现在|正在|马上|立即|现在)(?:为您|为你|为您们|为你)?(?:生成|创建|制作|画)(?:一张|一幅|一个)?(?:图像|图片|图|画)/i,
        /(?:好的|好的，)(?:我现在|马上|立即)(?:为您|为你)?(?:生成|创建|制作|画)/i,
        /(?:让我|我来)(?:为您|为你)?(?:生成|创建|制作|画)/i,
      ]

      const hasGenerateIntent = generateIntentPatterns.some(pattern => pattern.test(geminiReply))

      // 尝试从 Gemini 的回复中提取图像描述
      // 如果 Gemini 明确表达了生成意图，尝试提取描述
      if (hasGenerateIntent) {
        // 尝试提取图像描述（可能在"生成"、"创建"等词后面）
        const descriptionMatch = geminiReply.match(/(?:生成|创建|制作|画)(?:一张|一幅|一个)?(?:图像|图片|图|画)[：:，,，]?\s*(.+?)(?:。|！|!|$)/i)
        if (descriptionMatch && descriptionMatch[1]) {
          const imagePrompt = descriptionMatch[1].trim()
          if (imagePrompt.length > 3) {
            console.log('[Image Chat] 从 Gemini 回复中识别到生成图像意图，描述:', imagePrompt)
            // 异步调用图像生成，不阻塞回复显示
            setTimeout(() => {
              handleImageGenerationDirect(imagePrompt, userMessageId)
            }, 500)
            return
          }
        }

        // 如果没有提取到描述，但用户原始输入中有图像相关描述，使用用户输入
        const userInputHasImageDesc = trimmedPrompt.length > 5 && (
          trimmedPrompt.includes('生成') ||
          trimmedPrompt.includes('画') ||
          trimmedPrompt.includes('创建') ||
          trimmedPrompt.includes('制作') ||
          trimmedPrompt.includes('图像') ||
          trimmedPrompt.includes('图片')
        )

        if (userInputHasImageDesc) {
          console.log('[Image Chat] Gemini 表达了生成意图，使用用户原始输入作为描述:', trimmedPrompt)
          setTimeout(() => {
            handleImageGenerationDirect(trimmedPrompt, userMessageId)
          }, 500)
        }
      }
    } catch (error) {
      console.error('处理图像聊天消息失败:', error)
      setIsGeneratingImage(false)

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: '抱歉，处理您的消息时出现了问题。请稍后再试。',
        timestamp: new Date().toISOString(),
        status: 'sent',
      }

      setImageChatMessages((prev) => [...prev, assistantMessage])

      // 保存错误消息到数据库
      if (currentChatId) {
        try {
          await fetch(`/api/chats/${currentChatId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              role: 'assistant',
              content: '抱歉，处理您的消息时出现了问题。请稍后再试。',
            }),
          })
        } catch (saveError) {
          console.error('保存错误消息失败:', saveError)
        }
      }
    }
  }, [imageChatMessages, handleImageGenerationDirect, currentChatId, createNewChat, router])

  // 图像生成处理函数（用于 image view，保留用于其他地方调用）
  // 注意：这个函数现在已不再使用，因为所有消息都通过 handleImageChatMessage 处理
  // 保留此函数以防其他地方有调用
  const handleImageGeneration = useCallback(async (userPrompt: string) => {
    if (!userPrompt.trim() || isGeneratingImage) {
      return
    }

    // 立即添加用户消息
    const timestamp = new Date().toISOString()
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userPrompt.trim(),
      timestamp,
      status: 'sent',
    }

    setImageChatMessages((prev) => [...prev, userMessage])
    setIsGeneratingImage(true)

    // 使用新的 Gemini 处理逻辑
    await handleImageChatMessage(userPrompt.trim(), userMessage.id)
  }, [isGeneratingImage, handleImageChatMessage])

  // 自动滚动到底部
  useEffect(() => {
    if (isChatView && chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [chatMessages, isChatView])

  useEffect(() => {
    if (isImageView && imageChatContainerRef.current) {
      imageChatContainerRef.current.scrollTo({
        top: imageChatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [imageChatMessages, isImageView])

  // 渲染图像生成聊天视图
  const renderImageView = () => (
    <>
      <div
        ref={imageChatContainerRef}
        className="chat-messages-container"
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '800px',
          margin: '0 auto',
          padding: '32px 20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          minHeight: 0,
          height: '100%',
        }}
      >
        {imageChatMessages.map((message) => {
          const isUser = message.sender === 'user'
          return (
            <div
              key={message.id}
              style={{
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div
                style={{
                  maxWidth: isUser ? '72%' : '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  alignItems: isUser ? 'flex-end' : 'flex-start',
                }}
              >
                {message.text && (
                  <div
                    style={{
                      padding: '14px 18px',
                      borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      backgroundColor: 'transparent',
                      color: '#1f2937',
                      fontSize: '15px',
                      lineHeight: 1.7,
                      fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                      boxShadow: 'none',
                      border: 'none',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      letterSpacing: '0.01em',
                      fontWeight: 400,
                    }}
                  >
                    {message.text}
                  </div>
                )}
                {message.images && message.images.length > 0 && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: message.images.length > 1 ? 'repeat(2, 1fr)' : '1fr',
                      gap: '12px',
                      maxWidth: isUser ? '72%' : '100%',
                      marginTop: message.text ? '8px' : '0',
                    }}
                  >
                    {message.images.map((imageSrc, idx) => (
                      <div
                        key={idx}
                        style={{
                          borderRadius: '12px',
                          overflow: 'hidden',
                          border: '1px solid #e5e7eb',
                          backgroundColor: '#f3f4f6',
                          position: 'relative',
                          aspectRatio: '1',
                        }}
                      >
                        <NextImage
                          src={imageSrc}
                          alt={`Generated image ${idx + 1}`}
                          fill
                          style={{
                            objectFit: 'cover',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ height: '12px', width: '100%', flexShrink: 0 }} />
      <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', flexShrink: 0, paddingBottom: '24px' }}>
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
            marginTop: '-12px',
            position: 'relative',
          }}
        >
          <input
            ref={imageInputRef}
            type="file"
            // 允许选择所有文件类型，具体支持范围由 /api/upload 决定
            accept="*/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
          <button
            title="上传参考图片"
            onClick={() => imageInputRef.current?.click()}
            disabled={isUploadingImage || isGeneratingImage}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: referenceImage ? '#1A73E8' : '#F3F4F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: referenceImage ? '#ffffff' : '#1F2937',
              cursor: isUploadingImage || isGeneratingImage ? 'not-allowed' : 'pointer',
              opacity: isUploadingImage || isGeneratingImage ? 0.5 : 1,
            }}
          >
            {isUploadingImage ? (
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <UploadCloud style={{ width: '20px', height: '20px' }} />
            )}
          </button>
          {referenceImage && (
            <div style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '20px', overflow: 'hidden', border: '2px solid #1A73E8' }}>
              <NextImage
                src={referenceImage}
                alt="参考图片"
                fill
                style={{ objectFit: 'cover' }}
              />
              <button
                onClick={() => setReferenceImage(null)}
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  fontSize: '10px',
                }}
              >
                <X size={10} />
              </button>
            </div>
          )}
          <input
            type="text"
            placeholder={isVideoView ? "描述你想要生成的视频..." : "描述你想要生成的图像..."}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                // 检查是否正在处理，避免重复提交
                if (!isGeneratingImage && !isSendingMessage && prompt.trim()) {
                  void handleSendMessage()
                }
              }
            }}
            disabled={isGeneratingImage}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '13px',
              color: '#111827',
            }}
          />
          <div style={{ position: 'relative', marginTop: '-3px' }} ref={modelMenuRef}>
            <button
              onClick={() => setModelMenuOpen((prev) => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: 'none',
                borderRadius: '999px',
                padding: '6px 14px',
                background: '#ffffff',
                color: '#111827',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'all 0.2s ease',
                lineHeight: '1',
              }}
            >
              {isVideoView ? (
                <Video style={{ width: '16px', height: '16px' }} />
              ) : (
                <Images style={{ width: '16px', height: '16px' }} />
              )}
              <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, system-ui, sans-serif' }}>{isVideoView ? '视频' : '图片'}</span>
              <ChevronRight
                style={{
                  width: '14px',
                  height: '14px',
                  transform: modelMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              />
            </button>
            {modelMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 13px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '8px 8px',
                  background: '#ffffff',
                  borderRadius: '12px',
                  boxShadow: '0 16px 32px rgba(15, 23, 42, 0.12)',
                  minWidth: '130px',
                  minHeight: '84px',
                  zIndex: 10,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', textAlign: 'center', marginBottom: '2px' }}>宽高比</span>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '2px' }}>
                    {aspectOptions.map((option) => {
                      const isActive = selectedAspect === option.id
                      const shape =
                        option.id === 'portrait'
                          ? { width: 14, height: 20 }
                          : option.id === 'landscape'
                            ? { width: 20, height: 14 }
                            : { width: 18, height: 18 }
                      return (
                        <button
                          key={option.id}
                          onClick={() => {
                            setSelectedAspect(option.id)
                            setModelMenuOpen(false)
                          }}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            border: isActive ? '1px solid #111827' : '1px solid #d1d5db',
                            backgroundColor: isActive ? '#f3f4f6' : '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <span
                            style={{
                              display: 'block',
                              width: `${shape.width}px`,
                              height: `${shape.height}px`,
                              borderRadius: '4px',
                              border: isActive ? 'none' : '1px solid #9ca3af',
                              backgroundColor: isActive ? '#111827' : '#ffffff',
                            }}
                          />
                        </button>
                      )
                    })}
                  </div>
                  {isVideoView ? (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb', width: '100%' }}>
                      <button
                        onClick={() => {
                          router.push('/generate?view=image')
                          setModelMenuOpen(false)
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          width: '100%',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#ffffff',
                          color: '#111827',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f3f4f6'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ffffff'
                        }}
                      >
                        <Images style={{ width: '16px', height: '16px' }} />
                        <span>图片</span>
                      </button>
                    </div>
                  ) : (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb', width: '100%' }}>
                      <button
                        onClick={() => {
                          router.push('/generate?view=video')
                          setModelMenuOpen(false)
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          width: '100%',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#ffffff',
                          color: '#111827',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f3f4f6'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ffffff'
                        }}
                      >
                        <Video style={{ width: '16px', height: '16px' }} />
                        <span>视频</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )

  // 渲染聊天视图
  const renderChatView = () => (
    <>
      <div
        ref={chatContainerRef}
        className="chat-messages-container"
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '800px',
          margin: '0 auto',
          padding: '32px 20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          minHeight: 0,
          height: '100%',
        }}
      >
        {chatMessages.map((message) => {
          const isUser = message.sender === 'user'
          const bubbleColor = isUser ? '#2D72FF' : '#FFFFFF'
          const textColor = isUser ? '#FFFFFF' : '#111827'
          return (
            <div
              key={message.id}
              style={{
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {message.text && (
                <div
                  style={{
                    maxWidth: isUser ? '72%' : '100%',
                    padding: '14px 18px',
                    borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    backgroundColor: 'transparent',
                    color: '#1f2937',
                    fontSize: '15px',
                    lineHeight: 1.7,
                    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    boxShadow: 'none',
                    border: 'none',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    letterSpacing: '0.01em',
                    fontWeight: 400,
                  }}
                >
                  {message.text}
                </div>
              )}
              {message.images && message.images.length > 0 && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: message.images.length > 1 ? 'repeat(2, 1fr)' : '1fr',
                    gap: '12px',
                    maxWidth: isUser ? '72%' : '100%',
                    marginTop: message.text ? '8px' : '0',
                  }}
                >
                  {message.images.map((imageSrc, idx) => (
                    <div
                      key={idx}
                      style={{
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '1px solid #e5e7eb',
                        backgroundColor: '#f3f4f6',
                        position: 'relative',
                        aspectRatio: '1',
                      }}
                    >
                      <NextImage
                        src={imageSrc}
                        alt={`Generated image ${idx + 1}`}
                        fill
                        style={{
                          objectFit: 'cover',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          display: 'flex',
                          gap: '4px',
                        }}
                      >
                        <button
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = imageSrc
                            link.download = `image-${Date.now()}-${idx + 1}.png`
                            link.click()
                          }}
                          style={{
                            padding: '6px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            color: '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="下载图像"
                        >
                          <UploadCloud style={{ width: '14px', height: '14px' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div style={{ height: '12px', width: '100%', flexShrink: 0 }} />
      <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', flexShrink: 0, paddingBottom: '24px' }}>
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
            marginTop: '-12px',
          }}
        >
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
          <button
            title="上传参考图片"
            onClick={() => imageInputRef.current?.click()}
            disabled={isUploadingImage || isGeneratingImage}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: referenceImage ? '#1A73E8' : '#F3F4F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: referenceImage ? '#ffffff' : '#1F2937',
              cursor: isUploadingImage || isGeneratingImage ? 'not-allowed' : 'pointer',
              opacity: isUploadingImage || isGeneratingImage ? 0.5 : 1,
            }}
          >
            {isUploadingImage ? (
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <UploadCloud style={{ width: '20px', height: '20px' }} />
            )}
          </button>
          {referenceImage && (
            <div style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '20px', overflow: 'hidden', border: '2px solid #1A73E8' }}>
              <NextImage
                src={referenceImage}
                alt="参考图片"
                fill
                style={{ objectFit: 'cover' }}
              />
              <button
                onClick={() => setReferenceImage(null)}
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  fontSize: '10px',
                }}
              >
                <X size={10} />
              </button>
            </div>
          )}
          <input
            type="text"
            placeholder={isImageView ? "描述你想要生成的图像..." : "How can Grok help?"}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                void handleSendMessage()
              }
            }}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '13px',
              color: '#111827',
            }}
          />
          <div style={{ position: 'relative' }} ref={modelMenuRef}>
            <button
              onClick={() => setModelMenuOpen((prev) => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                borderRadius: '999px',
                padding: '6px 12px',
                background: '#ffffff',
                color: '#111827',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'all 0.2s ease',
              }}
            >
              {selectedModel}
              <ChevronRight style={{ width: '14px', height: '14px' }} />
            </button>
            {modelMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 8px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '12px',
                  background: '#ffffff',
                  borderRadius: '12px',
                  boxShadow: '0 16px 32px rgba(15, 23, 42, 0.12)',
                  minWidth: '140px',
                  zIndex: 10,
                }}
              >
                {modelOptions
                  .filter((option) => option !== selectedModel)
                  .map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedModel(option)
                        setModelMenuOpen(false)
                      }}
                      onMouseEnter={() => setHoveredModel(option)}
                      onMouseLeave={() => setHoveredModel(null)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1px solid transparent',
                        background: hoveredModel === option ? '#f3f4f6' : 'transparent',
                        color: '#111827',
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontWeight: 500,
                        textAlign: 'left',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {option}
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
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

  return (
    <>
      <main
        style={{
          display: 'flex',
          height: '100vh',
          backgroundColor: '#ffffff',
          overflow: 'hidden',
        }}
      >
        <aside
          ref={navRef}
          onClick={(event) => {
            if (event.target === navRef.current) {
              if (navExpanded) {
                setNavExpanded(false)
              } else {
                setNavExpanded(true)
              }
            }
          }}
          style={{
            width: navExpanded ? '240px' : '64px',
            height: '100%',
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
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: navExpanded ? '12px' : '16px', alignItems: navExpanded ? 'stretch' : 'center', paddingTop: navExpanded ? '0' : '20px' }}>
            {sidebarIcons.map((item, index) => {
              const itemTyped = item as { icon: any; label: string; action?: 'search' | 'tools'; href?: string; expandedLabel?: string; hideIconWhenExpanded?: boolean; collapsedIcon?: React.ReactNode; nonInteractive?: boolean }
              const Icon = itemTyped.icon
              const isSearch = itemTyped.action === 'search'
              const isTools = itemTyped.action === 'tools'
              const isHovered = hoveredSidebarIndex === index

              // 判断当前图标是否应该高亮
              let isActive = false
              if (isSearch) {
                isActive = searchOverlayOpen
              } else if (isTools) {
                isActive = aiToolsSidebarOpen
              } else {
                if (itemTyped.href) {
                  if (itemTyped.href === '/') {
                    // 首页需要检查当前路径
                    isActive = typeof window !== 'undefined' && window.location.pathname === '/'
                  } else if (itemTyped.href.includes('view=')) {
                    // 其他页面检查 view 参数
                    const hrefView = itemTyped.href.split('view=')[1]?.split('&')[0] || null
                    // 匹配当前的 view，默认 view 是 'chat'
                    isActive = hrefView === view
                  }
                }
              }

              const shouldShowIcon = !(navExpanded && itemTyped.hideIconWhenExpanded)
              const expandedLabelJustify = shouldShowIcon ? 'flex-start' : 'center'
              const defaultIconElement = <Icon style={{ width: '18px', height: '18px' }} />
              const iconElement = !navExpanded && itemTyped.collapsedIcon ? itemTyped.collapsedIcon : defaultIconElement

              if (itemTyped.nonInteractive) {
                return (
                  <div
                    key={itemTyped.label}
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
                width: isActive ? '36px' : '32px',
                height: isActive ? '36px' : '32px',
                borderRadius: '16px',
                border: 'none',
                backgroundColor: isActive ? '#F3F4F6' : (isHovered ? '#F3F4F6' : 'transparent'),
                color: '#1f2937',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                transition: 'transform 0.2s ease, color 0.2s ease, background-color 0.2s ease, width 0.2s ease, height 0.2s ease',
                transform: isHovered ? 'scale(1.12)' : 'scale(1)',
                userSelect: 'none',
              } as const

              const expandedStyle = {
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: isActive ? '12px 14px' : '10px 12px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: isActive ? '#F3F4F6' : (isHovered ? '#F3F4F6' : 'transparent'),
                color: '#1f2937',
                cursor: 'pointer',
                textDecoration: 'none',
                justifyContent: expandedLabelJustify,
                transition: 'background-color 0.2s ease, color 0.2s ease, padding 0.2s ease',
                position: 'relative',
                paddingLeft: shouldShowIcon ? (isActive ? '14px' : '12px') : '0',
                paddingRight: shouldShowIcon ? (isActive ? '14px' : '12px') : '0',
                userSelect: 'none',
              } as const

              if (isSearch) {
                return (
                  <div key={itemTyped.label} style={{ position: 'relative' }}>
                    <button
                      onMouseEnter={() => setHoveredSidebarIndex(index)}
                      onMouseLeave={() => setHoveredSidebarIndex(null)}
                      onClick={(event) => {
                        event.stopPropagation()
                        setNavExpanded(false)
                        setAiToolsSidebarOpen(false)
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
                    {!navExpanded && isHovered && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 'calc(100% + 12px)',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          backgroundColor: '#f9fafb',
                          color: '#111827',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          zIndex: 1000,
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          border: '1px solid #e5e7eb',
                          pointerEvents: 'none',
                        }}
                      >
                        {item.label}
                      </div>
                    )}
                  </div>
                )
              }

              if (isTools) {
                return (
                  <div key={itemTyped.label} style={{ position: 'relative' }}>
                    <button
                      onMouseEnter={() => setHoveredSidebarIndex(index)}
                      onMouseLeave={() => setHoveredSidebarIndex(null)}
                      onClick={(event) => {
                        event.stopPropagation()
                        setSearchOverlayOpen(false)
                        setHoveredSidebarIndex(null) // 清除悬停状态，隐藏指示条
                        setAiToolsSidebarOpen((prev) => !prev)
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
                    {!navExpanded && isHovered && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 'calc(100% + 12px)',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          backgroundColor: '#f9fafb',
                          color: '#111827',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          zIndex: 1000,
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          border: '1px solid #e5e7eb',
                          pointerEvents: 'none',
                        }}
                      >
                        {item.label}
                      </div>
                    )}
                  </div>
                )
              }

              const itemWithHref = item as { href?: string; label: string }
              if (itemWithHref.href) {
                return (
                  <div key={itemWithHref.label} style={{ position: 'relative' }}>
                    <Link
                      href={itemWithHref.href}
                      onMouseEnter={() => setHoveredSidebarIndex(index)}
                      onMouseLeave={() => setHoveredSidebarIndex(null)}
                      onClick={(event) => {
                        event.stopPropagation()
                        setAiToolsSidebarOpen(false)
                        if (!navExpanded) {
                          return
                        }
                        setNavExpanded(false)
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
                    {!navExpanded && isHovered && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 'calc(100% + 12px)',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          backgroundColor: '#f9fafb',
                          color: '#111827',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          zIndex: 1000,
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          border: '1px solid #e5e7eb',
                          pointerEvents: 'none',
                        }}
                      >
                        {item.label}
                      </div>
                    )}
                  </div>
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
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      backgroundColor: userAvatarHovered ? '#F3F4F6' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.2s ease',
                    }}
                    onMouseEnter={() => setUserAvatarHovered(true)}
                    onMouseLeave={() => setUserAvatarHovered(false)}
                  >
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
                        transition: 'transform 0.2s ease',
                        transform: userAvatarHovered ? 'scale(1.05)' : 'scale(1)',
                      }}
                    >
                      {(user.username || user.phone || 'U').charAt(0)}
                    </button>
                  </div>
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
                        padding: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        zIndex: 20,
                        minWidth: '160px',
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          cursor: 'pointer',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          backgroundColor: 'transparent',
                          transition: 'background-color 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#F3F4F6'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setUserMenuOpen(false)
                          router.replace('/generate?view=settings&tab=overview')
                        }}
                      >
                        <Settings style={{ width: '18px', height: '18px', color: '#1f2937' }} />
                        <span style={{ fontSize: '13px', color: '#111827', lineHeight: 1 }}>设置</span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          cursor: 'pointer',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          backgroundColor: 'transparent',
                          transition: 'background-color 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#F3F4F6'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setUserMenuOpen(false)
                          router.replace('/generate?view=tasks')
                        }}
                      >
                        <Clock style={{ width: '18px', height: '18px', color: '#1f2937' }} />
                        <span style={{ fontSize: '13px', color: '#111827', lineHeight: 1 }}>任务</span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          cursor: 'pointer',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          backgroundColor: 'transparent',
                          transition: 'background-color 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#F3F4F6'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setUserMenuOpen(false)
                          setFeedbackModalOpen(true)
                        }}
                      >
                        <MessageCircle style={{ width: '18px', height: '18px', color: '#1f2937' }} />
                        <span style={{ fontSize: '13px', color: '#111827', lineHeight: 1 }}>反馈</span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          cursor: 'pointer',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          backgroundColor: 'transparent',
                          transition: 'background-color 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#F3F4F6'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setUserMenuOpen(false)
                          router.replace('/generate?view=subscription')
                        }}
                      >
                        <CreditCard style={{ width: '18px', height: '18px', color: '#1f2937' }} />
                        <span style={{ fontSize: '13px', color: '#111827', lineHeight: 1 }}>订阅</span>
                      </div>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false)
                          void logout()
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#FEF2F2'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          fontSize: '13px',
                          color: '#ef4444',
                          background: 'none',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          transition: 'background-color 0.2s ease',
                        }}
                      >
                        <LogOut style={{ width: '18px', height: '18px' }} />
                        退出登陆
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </aside>

        {searchOverlayOpen && (
          <div
            onClick={() => setSearchOverlayOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
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
                width: 'min(1430px, calc(100vw + 126px))',
                height: 'min(1280px, calc(100vh - 148px))',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
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
                    width: '430px',
                    borderRight: '1px solid #e5e7eb',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  {/* 操作区域 */}
                  <div
                    style={{
                      padding: '12px 14px',
                      borderBottom: '1px solid #e5e7eb',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>操作</div>
                    <button
                      onClick={async () => {
                        const newChatId = await createNewChat()
                        if (newChatId) {
                          router.push(`/generate?view=chat&chatId=${newChatId}`)
                          setSearchOverlayOpen(false)
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: 'transparent',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#111827',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9fafb'
                        e.currentTarget.style.borderColor = '#d1d5db'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.borderColor = '#e5e7eb'
                      }}
                    >
                      <Pencil size={14} />
                      创建新聊天
                    </button>
                  </div>

                  {/* 会话列表（按时间分组） */}
                  <div
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: '12px 14px 18px',
                    }}
                  >
                    {groupedChatSessions.length === 0 ? (
                      <div style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '20px' }}>
                        还没有对话，点击上方按钮创建新对话
                      </div>
                    ) : (
                      groupedChatSessions.map((group) => {
                        // 过滤该分组中的会话
                        const filteredGroupItems = searchQuery.trim()
                          ? group.items.filter(
                            (item) =>
                              item.title.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
                              item.subtitle.toLowerCase().includes(searchQuery.trim().toLowerCase())
                          )
                          : group.items

                        if (filteredGroupItems.length === 0) return null

                        return (
                          <div key={group.section} style={{ marginBottom: '24px' }}>
                            <div
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#9ca3af',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                marginBottom: '8px',
                                paddingLeft: '4px',
                              }}
                            >
                              {group.section}
                            </div>
                            {filteredGroupItems.map((item) => {
                              const isActive = item.id === activeSearchId
                              const isHovered = hoveredSearchId === item.id
                              const isEditing = editingSearchId === item.id
                              return (
                                <div
                                  key={item.id}
                                  style={{
                                    width: '100%',
                                    borderRadius: '6px',
                                    padding: '10px 8px',
                                    backgroundColor: isActive ? '#f3f4f6' : isHovered ? '#f9fafb' : 'transparent',
                                    border: isActive ? '1px solid #1A73E8' : '1px solid transparent',
                                    transition: 'all 0.2s ease',
                                    position: 'relative',
                                    marginBottom: '2px',
                                  }}
                                  onMouseEnter={() => setHoveredSearchId(item.id)}
                                  onMouseLeave={() => {
                                    if (!isEditing) {
                                      setHoveredSearchId(null)
                                    }
                                  }}
                                >
                                  <button
                                    onClick={() => {
                                      setActiveSearchId(item.id)
                                    }}
                                    onDoubleClick={() => {
                                      switchChat(item.chatId)
                                      setSearchOverlayOpen(false)
                                    }}
                                    style={{
                                      width: '100%',
                                      border: 'none',
                                      textAlign: 'left',
                                      backgroundColor: 'transparent',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '4px',
                                      padding: 0,
                                    }}
                                  >
                                    {isEditing ? (
                                      <input
                                        type="text"
                                        value={editSearchTitle}
                                        onChange={(e) => setEditSearchTitle(e.target.value)}
                                        onBlur={() => {
                                          if (editSearchTitle.trim()) {
                                            handleRenameSearchItem(item.id, editSearchTitle)
                                          } else {
                                            setEditingSearchId(null)
                                            setEditSearchTitle('')
                                          }
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            if (editSearchTitle.trim()) {
                                              handleRenameSearchItem(item.id, editSearchTitle)
                                            }
                                          } else if (e.key === 'Escape') {
                                            setEditingSearchId(null)
                                            setEditSearchTitle('')
                                          }
                                        }}
                                        autoFocus
                                        style={{
                                          fontSize: '13px',
                                          fontWeight: 600,
                                          color: '#111827',
                                          border: '1px solid #1A73E8',
                                          borderRadius: '4px',
                                          padding: '4px 8px',
                                          outline: 'none',
                                          width: '100%',
                                        }}
                                      />
                                    ) : (
                                      <span
                                        style={{
                                          fontSize: '13px',
                                          fontWeight: 600,
                                          color: isActive ? '#1A73E8' : '#111827',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                        }}
                                      >
                                        {item.title}
                                      </span>
                                    )}
                                  </button>
                                  {isHovered && !isEditing && (
                                    <div
                                      style={{
                                        position: 'absolute',
                                        right: '8px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        backgroundColor: '#F3F4F6',
                                        borderRadius: '4px',
                                        padding: '2px',
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleStartRename(item.id, item.title)
                                        }}
                                        style={{
                                          border: 'none',
                                          background: 'transparent',
                                          cursor: 'pointer',
                                          padding: '4px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          borderRadius: '3px',
                                          color: '#6b7280',
                                          minWidth: '28px',
                                          minHeight: '28px',
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = '#e5e7eb'
                                          e.currentTarget.style.color = '#111827'
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = 'transparent'
                                          e.currentTarget.style.color = '#6b7280'
                                        }}
                                        title="编辑"
                                      >
                                        <Pencil size={18} />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          const fakeEvent = { stopPropagation: () => { } } as React.MouseEvent
                                          handleDeleteChat(item.chatId, fakeEvent)
                                        }}
                                        style={{
                                          border: 'none',
                                          background: 'transparent',
                                          cursor: 'pointer',
                                          padding: '4px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          borderRadius: '3px',
                                          color: '#6b7280',
                                          minWidth: '28px',
                                          minHeight: '28px',
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = '#fee2e2'
                                          e.currentTarget.style.color = '#dc2626'
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = 'transparent'
                                          e.currentTarget.style.color = '#6b7280'
                                        }}
                                        title="删除"
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  {/* 预览内容区域 */}
                  <div
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: '24px 48px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'center',
                    }}
                  >
                    {previewSearchItem ? (
                      <div style={{ width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '12px', color: '#111827' }}>
                        {previewSearchItem.subtitle && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#9ca3af' }}>
                            <span style={{ color: '#6b7280' }}>{previewSearchItem.subtitle}</span>
                          </div>
                        )}
                        <h3 style={{ fontSize: '14px', fontWeight: 400, lineHeight: 1.4 }}>{previewSearchItem.title}</h3>
                        {previewSearchItem.chatId ? (
                          // 显示聊天消息
                          <div
                            style={{
                              fontSize: '14px',
                              color: '#4b5563',
                              lineHeight: 1.6,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px',
                            }}
                          >
                            {loadingChatMessages ? (
                              <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>加载中...</div>
                            ) : selectedChatMessages.length === 0 ? (
                              <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>暂无消息</div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {selectedChatMessages.slice(-5).map((message: any, index: number) => (
                                  <div
                                    key={message.id}
                                    style={{
                                      fontSize: '14px',
                                      color: '#111827',
                                      whiteSpace: 'pre-wrap',
                                      wordBreak: 'break-word',
                                      lineHeight: 1.6,
                                    }}
                                  >
                                    {message.content}
                                  </div>
                                ))}
                                {selectedChatMessages.length > 5 && (
                                  <div style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', padding: '8px 0' }}>
                                    还有 {selectedChatMessages.length - 5} 条消息...
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            style={{
                              fontSize: '14px',
                              color: '#4b5563',
                              lineHeight: 1.6,
                            }}
                          >
                            预览内容示例：这是"{previewSearchItem.title}"的完整摘要区域，未来可以显示对话首段、关键词或高亮匹配结果。当前为静态占位，后续可接入真实数据。
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ color: '#9ca3af', fontSize: '14px' }}>请选择结果查看详情</div>
                    )}
                  </div>

                  {/* 底部操作栏 */}
                  {previewSearchItem && previewSearchItem.chatId && (
                    <footer
                      style={{
                        borderTop: '1px solid #e5e7eb',
                        padding: '12px 24px',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <button
                        onClick={() => {
                          if (previewSearchItem.chatId) {
                            switchChat(previewSearchItem.chatId)
                            setSearchOverlayOpen(false)
                          }
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#1A73E8',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#1557B0'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#1A73E8'
                        }}
                      >
                        前往
                      </button>
                      <button
                        onClick={() => {
                          if (previewSearchItem) {
                            handleStartRename(previewSearchItem.id, previewSearchItem.title)
                          }
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: 'transparent',
                          color: '#6b7280',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f9fafb'
                          e.currentTarget.style.borderColor = '#d1d5db'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.borderColor = '#e5e7eb'
                        }}
                      >
                        编辑
                        <span style={{ marginLeft: '4px', fontSize: '11px', color: '#9ca3af' }}>Ctrl+E</span>
                      </button>
                      <button
                        onClick={() => {
                          if (previewSearchItem?.chatId) {
                            const fakeEvent = { stopPropagation: () => { } } as React.MouseEvent
                            handleDeleteChat(previewSearchItem.chatId, fakeEvent)
                          }
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: 'transparent',
                          color: '#dc2626',
                          border: '1px solid #fee2e2',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#fee2e2'
                          e.currentTarget.style.borderColor = '#fecaca'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.borderColor = '#fee2e2'
                        }}
                      >
                        删除
                        <span style={{ marginLeft: '4px', fontSize: '11px', color: '#9ca3af' }}>Ctrl+D</span>
                      </button>
                    </footer>
                  )}
                  {!previewSearchItem && (
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
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <section
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: isChatView || isImageView || isVideoView ? '0' : '48px 0',
            width: '100%',
            height: '100%',
            overflow: isChatView || isImageView || isVideoView ? 'hidden' : 'visible',
            minHeight: 0,
          }}
        >
          {view === 'settings' ? (
            renderSettingsView()
          ) : view === 'tasks' || view === 'projects' ? (
            renderTasksView()
          ) : view === 'gallery' ? (
            <GalleryView />
          ) : view === 'files' ? (
            renderFilesView()
          ) : view === 'feedback' ? (
            renderHelpView()
          ) : view === 'messages' ? (
            renderMessagesView()
          ) : view === 'subscription' ? (
            renderSubscriptionView()
          ) : isGeminiTest ? (
            renderGeminiTestView()
          ) : isChatView ? (
            renderChatView()
          ) : isImageView ? (
            renderImageView()
          ) : isVideoView ? (
            renderImageView()
          ) : staticView ? (
            renderStaticView(staticView)
          ) : (
            <>
              <div style={{ flex: 1, width: '100%' }} />
              <div style={{ width: '100%', maxWidth: '780px' }}>
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
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    title="上传参考图片"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isUploadingImage || isGeneratingImage || isSendingMessage}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '20px',
                      border: 'none',
                      backgroundColor: referenceImage ? '#1A73E8' : '#F3F4F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: referenceImage ? '#ffffff' : '#1F2937',
                      cursor: isUploadingImage || isGeneratingImage || isSendingMessage ? 'not-allowed' : 'pointer',
                      opacity: isUploadingImage || isGeneratingImage || isSendingMessage ? 0.5 : 1,
                    }}
                  >
                    {isUploadingImage ? (
                      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <UploadCloud style={{ width: '20px', height: '20px' }} />
                    )}
                  </button>
                  {referenceImage && (
                    <div style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '20px', overflow: 'hidden', border: '2px solid #1A73E8' }}>
                      <NextImage
                        src={referenceImage}
                        alt="参考图片"
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                      <button
                        onClick={() => setReferenceImage(null)}
                        style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-4px',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          backgroundColor: '#ef4444',
                          border: 'none',
                          color: '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                          fontSize: '10px',
                        }}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="How can Grok help?"
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault()
                        // 检查是否正在处理，避免重复提交
                        if (!isGeneratingImage && !isSendingMessage && prompt.trim()) {
                          void handleSendMessage()
                        }
                      }
                    }}
                    disabled={isGeneratingImage || isSendingMessage}
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      fontSize: '13px',
                      color: '#111827',
                    }}
                  />
                  {!isImageView && !isVideoView && (
                    <button
                      title="语音输入"
                      disabled={!prompt.trim() || isGeneratingImage || isSendingMessage}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '18px',
                        border: 'none',
                        backgroundColor: !prompt.trim() || isGeneratingImage || isSendingMessage ? '#e5e7eb' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: !prompt.trim() || isGeneratingImage || isSendingMessage ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <Mic style={{ width: '18px', height: '18px' }} />
                    </button>
                  )}
                  <div style={{ position: 'relative' }} ref={modelMenuRef}>
                    <button
                      onClick={() => setModelMenuOpen((prev) => !prev)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: isImageView || isVideoView ? '8px' : '6px',
                        border: 'none',
                        borderRadius: '999px',
                        padding: isImageView || isVideoView ? '6px 14px' : '6px 12px',
                        background: '#ffffff',
                        color: '#111827',
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontWeight: 500,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {isVideoView || isImageView ? (
                        <>
                          {isVideoView ? (
                            <Video style={{ width: '16px', height: '16px' }} />
                          ) : (
                            <Images style={{ width: '16px', height: '16px' }} />
                          )}
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>{isVideoView ? '视频' : '图片'}</span>
                          <ChevronRight
                            style={{
                              width: '14px',
                              height: '14px',
                              transform: modelMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s ease',
                            }}
                          />
                        </>
                      ) : (
                        <>
                          {selectedModel}
                          <ChevronRight style={{ width: '14px', height: '14px' }} />
                        </>
                      )}
                    </button>
                    {modelMenuOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 'calc(100% + 8px)',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          padding: isImageView || isVideoView ? '8px 8px' : '12px',
                          background: '#ffffff',
                          borderRadius: '12px',
                          boxShadow: '0 16px 32px rgba(15, 23, 42, 0.12)',
                          minWidth: isImageView || isVideoView ? '130px' : '140px',
                          minHeight: isImageView || isVideoView ? '84px' : undefined,
                          zIndex: 10,
                        }}
                      >
                        {isVideoView || isImageView ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', textAlign: 'center', marginBottom: '2px' }}>宽高比</span>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '2px' }}>
                              {aspectOptions.map((option) => {
                                const isActive = selectedAspect === option.id
                                const shape =
                                  option.id === 'portrait'
                                    ? { width: 14, height: 20 }
                                    : option.id === 'landscape'
                                      ? { width: 20, height: 14 }
                                      : { width: 18, height: 18 }
                                return (
                                  <button
                                    key={option.id}
                                    onClick={() => setSelectedAspect(option.id)}
                                    style={{
                                      width: '28px',
                                      height: '28px',
                                      borderRadius: '8px',
                                      border: isActive ? '1px solid #111827' : '1px solid #d1d5db',
                                      backgroundColor: isActive ? '#f3f4f6' : '#ffffff',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                    }}
                                  >
                                    <span
                                      style={{
                                        display: 'block',
                                        width: `${shape.width}px`,
                                        height: `${shape.height}px`,
                                        borderRadius: '4px',
                                        border: isActive ? 'none' : '1px solid #9ca3af',
                                        backgroundColor: isActive ? '#111827' : '#ffffff',
                                      }}
                                    />
                                  </button>
                                )
                              })}
                            </div>
                            {isImageView && (
                              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb', width: '100%' }}>
                                <button
                                  onClick={() => {
                                    router.push('/generate?view=video')
                                    setModelMenuOpen(false)
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    width: '100%',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: '#ffffff',
                                    color: '#111827',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#f3f4f6'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#ffffff'
                                  }}
                                >
                                  <Video style={{ width: '16px', height: '16px' }} />
                                  <span>视频</span>
                                </button>
                              </div>
                            )}
                            {isVideoView && (
                              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb', width: '100%' }}>
                                <button
                                  onClick={() => {
                                    router.push('/generate?view=image')
                                    setModelMenuOpen(false)
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    width: '100%',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: '#ffffff',
                                    color: '#111827',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#f3f4f6'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#ffffff'
                                  }}
                                >
                                  <Images style={{ width: '16px', height: '16px' }} />
                                  <span>图片</span>
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          modelOptions
                            .filter((option) => option !== selectedModel)
                            .map((option) => (
                              <button
                                key={option}
                                onClick={() => {
                                  setSelectedModel(option)
                                  setModelMenuOpen(false)
                                }}
                                onMouseEnter={() => setHoveredModel(option)}
                                onMouseLeave={() => setHoveredModel(null)}
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '8px',
                                  border: '1px solid transparent',
                                  background: hoveredModel === option ? '#f3f4f6' : 'transparent',
                                  color: '#111827',
                                  fontSize: '13px',
                                  cursor: 'pointer',
                                  fontWeight: 500,
                                  textAlign: 'left',
                                  transition: 'background 0.15s ease',
                                }}
                              >
                                {option}
                              </button>
                            ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      {/* AI 工具侧栏 */}
      <AIToolsSidebar
        isOpen={aiToolsSidebarOpen}
        onClose={() => setAiToolsSidebarOpen(false)}
        navExpanded={navExpanded}
        onToolSelect={(tool) => {
          setSelectedAITool(tool)

          const config = aiToolPromptConfigs[tool.id]
          if (config) {
            // 切换到合适的视图（目前所有预设均为图像视图）
            const params = new URLSearchParams(searchParams.toString())
            params.set('view', config.view)
            router.push(`/generate?${params.toString()}`)

            // 设置模型与宽高比
            if (config.view === 'image') {
              setSelectedModel('图片')
              if (config.aspect) {
                setSelectedAspect(config.aspect)
              }
            } else if (config.view === 'video') {
              setSelectedModel('视频')
            }

            // 预填高质量提示词，用户可以在生成前微调
            setPrompt(config.prompt)

            toast.success(
              config.hint ??
              `已为你准备「${tool.name}」的高质量提示词，可在输入框中补充细节后点击生成。`,
            )
          } else {
            toast.success(`已选择工具：${tool.name}，请在输入框中补充你的需求后生成。`)
          }
        }}
      />

      {/* 反馈问题模态框 */}
      {feedbackModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setFeedbackModalOpen(false)
              setFeedbackTypeDropdownOpen(false)
              setFeedbackType('')
              setFeedbackContent('')
            }
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '520px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题栏 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px 24px',
                borderBottom: '1px solid #e5e7eb',
                position: 'relative',
              }}
            >
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0, textAlign: 'center' }}>
                反馈问题
              </h2>
              <button
                onClick={() => {
                  setFeedbackModalOpen(false)
                  setFeedbackTypeDropdownOpen(false)
                  setFeedbackType('')
                  setFeedbackContent('')
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280',
                  position: 'absolute',
                  right: '24px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* 内容区域 */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
              {/* 反馈类型 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                  反馈类型
                </label>
                <div style={{ position: 'relative' }} ref={feedbackTypeDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setFeedbackTypeDropdownOpen(!feedbackTypeDropdownOpen)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      backgroundColor: '#ffffff',
                      fontSize: '14px',
                      color: feedbackType ? '#111827' : '#9ca3af',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{feedbackType || '选择报告类型'}</span>
                    <ChevronDown
                      style={{
                        width: '16px',
                        height: '16px',
                        color: '#6b7280',
                        transform: feedbackTypeDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </button>
                  {feedbackTypeDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '4px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        zIndex: 10001,
                        overflow: 'hidden',
                      }}
                    >
                      {[
                        '一般意见反馈',
                        '问题/漏洞报告',
                        '儿童安全问题',
                        '回应反馈',
                      ].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setFeedbackType(type)
                            setFeedbackTypeDropdownOpen(false)
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            fontSize: '14px',
                            color: '#111827',
                            textAlign: 'left',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f3f4f6'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 反馈内容 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                  你的反馈
                </label>
                <textarea
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  placeholder="请描述你遇到的问题或对 AIpiccenter 的反馈意见。"
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#111827',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    lineHeight: '1.5',
                  }}
                />
              </div>
            </div>

            {/* 底部按钮 */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setFeedbackModalOpen(false)
                  setFeedbackTypeDropdownOpen(false)
                  setFeedbackType('')
                  setFeedbackContent('')
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#f3f4f6',
                  color: '#111827',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6'
                }}
              >
                取消
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!feedbackType || !feedbackContent.trim()) {
                    toast.error('请选择反馈类型并填写反馈内容')
                    return
                  }

                  try {
                    const response = await fetch('/api/feedback', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        type: feedbackType,
                        content: feedbackContent,
                        page: `generate?view=${view}`,
                      }),
                    })

                    const data = await response.json()
                    if (!response.ok || !data.success) {
                      toast.error(data.error || '反馈提交失败，请稍后再试')
                      return
                    }

                    toast.success('反馈已发送，感谢你的意见！')
                    setFeedbackModalOpen(false)
                    setFeedbackTypeDropdownOpen(false)
                    setFeedbackType('')
                    setFeedbackContent('')
                  } catch (error) {
                    console.error('反馈提交失败:', error)
                    toast.error('反馈提交失败，请检查网络后重试')
                  }
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#1f2937',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#111827'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1f2937'
                }}
              >
                发送
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}