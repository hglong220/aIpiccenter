'use client'

import { Image, ShoppingBag, Package, Home, Building2, Scissors, Camera, Video } from 'lucide-react'

export interface AITool {
  id: string
  name: string
  displayName?: string
  icon: React.ReactNode
  description: string
  requiresImage: boolean
  category: 'enhancement' | 'creation' | 'design' | 'photo'
}

const aiTools: AITool[] = [
  {
    id: 'upscale',
    name: '图片高清放大',
    displayName: '放大',
    icon: <Image size={20} strokeWidth={1} />,
    description: '将图片放大并提升清晰度',
    requiresImage: true,
    category: 'enhancement',
  },
  {
    id: 'ecommerce-poster',
    name: '电商海报制作',
    displayName: '电商',
    icon: <ShoppingBag size={20} strokeWidth={1} />,
    description: '快速生成专业的电商促销海报',
    requiresImage: false,
    category: 'design',
  },
  {
    id: 'product-image',
    name: '产品图制作',
    displayName: '产品',
    icon: <Package size={20} strokeWidth={1} />,
    description: '生成高质量的产品展示图',
    requiresImage: false,
    category: 'creation',
  },
  {
    id: 'interior-design',
    name: '室内效果图制作',
    displayName: '室内',
    icon: <Home size={20} strokeWidth={1} />,
    description: '创建逼真的室内设计效果图',
    requiresImage: false,
    category: 'creation',
  },
  {
    id: 'architecture',
    name: '建筑效果图制作',
    displayName: '建筑',
    icon: <Building2 size={20} strokeWidth={1} />,
    description: '生成专业的建筑外观效果图',
    requiresImage: false,
    category: 'creation',
  },
  {
    id: 'remove-background',
    name: '背景移除',
    displayName: '移除',
    icon: <Scissors size={20} strokeWidth={1} />,
    description: '智能移除图片背景',
    requiresImage: false,
    category: 'enhancement',
  },
  {
    id: 'id-photo',
    name: '二寸照片',
    displayName: '证照',
    icon: <Camera size={20} strokeWidth={1} />,
    description: '生成标准二寸证件照',
    requiresImage: false,
    category: 'photo',
  },
  {
    id: 'image-to-video',
    name: '图生视频',
    displayName: '电影',
    icon: <Video size={20} strokeWidth={1} />,
    description: '将静态图片转换为动态视频',
    requiresImage: false,
    category: 'enhancement',
  },
]

interface AIToolsSidebarProps {
  isOpen: boolean
  onClose: () => void
  onToolSelect?: (tool: AITool) => void
  navExpanded?: boolean
}

export function AIToolsSidebar({ isOpen, onClose, onToolSelect, navExpanded = false }: AIToolsSidebarProps) {
  const filteredTools = aiTools

  if (!isOpen) return null

  // 侧栏位置：从左侧导航栏打开
  const sidebarStyle: React.CSSProperties = {
    position: 'fixed',
    top: '155px',
    left: navExpanded ? '260px' : '84px',
    bottom: 'auto',
    width: '120px',
    maxHeight: 'calc(100vh - 185px)',
    backgroundColor: '#F9FAFB',
    boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)',
    zIndex: 999,
    display: 'flex',
    flexDirection: 'column',
    transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform 0.3s ease, left 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
    borderRight: '1px solid #f0f0f0',
    borderRadius: '12px',
  }

  return (
    <>
      {/* 侧栏 */}
      <div style={sidebarStyle} data-ai-tools-sidebar>

        {/* 工具列表 */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '10px',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '6px',
            }}
          >
            {filteredTools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => {
                  onToolSelect?.(tool)
                  onClose()
                }}
                title={tool.name}
                style={{
                  padding: '6px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  minHeight: '60px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6'
                  e.currentTarget.style.transform = 'scale(1.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    backgroundColor: '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1f2937',
                  }}
                >
                  {tool.icon}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: '#6b7280',
                    marginTop: '2px',
                    textAlign: 'center',
                    lineHeight: 1.2,
                  }}
                >
                  {tool.displayName || tool.name}
                </div>
                {tool.requiresImage && (
                  <div
                    style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      backgroundColor: '#1A73E8',
                      marginTop: '-6px',
                      marginLeft: '22px',
                      position: 'absolute',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  )
}

