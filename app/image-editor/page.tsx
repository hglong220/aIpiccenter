'use client'

import { useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Brush, Eraser, Sparkles, ImageIcon, Expand, ArrowLeft, Wand2, Eye, EyeOff } from 'lucide-react'
import { EditorCanvas, type EditorCanvasHandle } from '@/components/image-editor/EditorCanvas'

const editingTools = [
  {
    id: 'inpaint',
    name: '涂抹替换',
    description: '选中区域并用文字描述替换内容',
    icon: Brush,
  },
  {
    id: 'erase',
    name: '擦除修复',
    description: '擦除不需要的元素并自动补全背景',
    icon: Eraser,
  },
  {
    id: 'background',
    name: '背景替换',
    description: '一键分离主体与背景，输入 Prompt 替换背景',
    icon: ImageIcon,
  },
  {
    id: 'upscale',
    name: '放大补全',
    description: '提升分辨率或向外延展画布边缘',
    icon: Expand,
  },
]

export default function ImageEditorPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTool, setActiveTool] = useState(editingTools[0].id)
  const [drawMode, setDrawMode] = useState<'brush' | 'eraser'>('brush')
  const [brushSize, setBrushSize] = useState(40)
  const [showMaskOverlay, setShowMaskOverlay] = useState(true)
  const [maskPreview, setMaskPreview] = useState<string | null>(null)
  const canvasRef = useRef<EditorCanvasHandle>(null)

  const imageUrl = searchParams?.get('imageUrl') ?? ''
  const prompt = searchParams?.get('prompt') ?? ''
  const readableToolName = editingTools.find((tool) => tool.id === activeTool)?.name ?? '涂抹替换'

  const clearMask = () => {
    canvasRef.current?.clear()
    setMaskPreview(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.push('/generate')}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4" /> 返回生成页
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">AI 图像编辑工作区</h1>
              <p className="text-sm text-gray-500">针对企业需求设计的可视化编辑器：支持涂抹替换、背景分离与智能放大</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn secondary text-sm px-4 py-2">预览原图</button>
            <button className="btn primary text-sm px-4 py-2 inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> 应用更改
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-container mx-auto grid gap-6 px-6 py-8 lg:grid-cols-12 lg:items-start">
        {/* Tool panel */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900">编辑工具</h2>
              <p className="mt-1 text-xs text-gray-500">选择不同的处理方式，结合提示词实现高级编辑</p>
            </div>
            <nav className="divide-y divide-gray-100">
              {editingTools.map((tool) => {
                const Icon = tool.icon
                const active = tool.id === activeTool
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => setActiveTool(tool.id)}
                    className={`w-full text-left px-5 py-4 transition-colors ${
                      active
                        ? 'bg-primary-50 border-l-4 border-primary-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 rounded-md p-1.5 ${active ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${active ? 'text-primary-700' : 'text-gray-800'}`}>{tool.name}</p>
                        <p className="mt-1 text-xs text-gray-500 leading-relaxed">{tool.description}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">工作流提示</h3>
            <ul className="mt-3 space-y-2 text-xs text-gray-500 leading-relaxed">
              <li>· 使用涂抹工具锁定需要替换或修复的区域。</li>
              <li>· 在右侧输入详细 Prompt，描述希望出现的内容。</li>
              <li>· 实时预览可以切换查看对比，满意后点击应用更改。</li>
            </ul>
          </div>
        </aside>

        {/* Canvas area */}
        <section className="lg:col-span-6">
          <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Wand2 className="h-4 w-4 text-primary-500" />
                当前操作：{readableToolName}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1">
                  画笔：{drawMode === 'brush' ? '涂抹' : '擦除'}
                </span>
                <span>按住 Alt 可暂时切换擦除</span>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <EditorCanvas
                imageUrl={imageUrl || undefined}
                selectedTool={drawMode}
                brushSize={brushSize}
                showMaskOverlay={showMaskOverlay}
                onMaskUpdate={setMaskPreview}
                ref={canvasRef}
              />
              {!imageUrl && (
                <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500">
                  暂未选择参考图像，从生成结果中点击“编辑”即可加载图像，也可以在未来支持直接上传。
                </div>
              )}
            </div>

            <div className="grid gap-4 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">原始提示词</p>
                <p className="mt-2 text-sm text-gray-800 line-clamp-3">{prompt || '暂无原始提示词'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">遮罩状态</p>
                <p className="mt-2 text-sm text-gray-800">{maskPreview ? '已创建遮罩' : '未创建遮罩'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">导出尺寸</p>
                <p className="mt-2 text-sm text-gray-800">默认保持原始尺寸，可在生成时修改</p>
              </div>
            </div>
          </div>
        </section>

        {/* Prompt & settings */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">编辑描述</h2>
            <p className="mt-2 text-xs text-gray-500">使用自然语言描述希望对选区进行的变化，支持中文与英文混合输入。</p>
            <textarea
              rows={6}
              className="mt-4 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 outline-none focus:border-primary-400 focus:bg-white"
              placeholder="示例：将人物服装替换为白色西装，并保持灯光柔和。"
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-xs font-semibold text-gray-600">
                绘制模式
                <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-1 text-sm text-gray-600">
                  <button
                    type="button"
                    onClick={() => setDrawMode('brush')}
                    className={`flex-1 rounded-full px-3 py-1 ${drawMode === 'brush' ? 'bg-white text-primary-600 shadow' : ''}`}
                  >
                    <Brush className="mr-1 inline h-4 w-4" /> 涂抹
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawMode('eraser')}
                    className={`flex-1 rounded-full px-3 py-1 ${drawMode === 'eraser' ? 'bg-white text-primary-600 shadow' : ''}`}
                  >
                    <Eraser className="mr-1 inline h-4 w-4" /> 擦除
                  </button>
                </div>
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold text-gray-600">
                画笔大小
                <div className="rounded-full border border-gray-200 bg-gray-50 px-3 py-2">
                  <input
                    type="range"
                    min={10}
                    max={120}
                    value={brushSize}
                    onChange={(event) => setBrushSize(Number(event.target.value))}
                    className="w-full"
                  />
                  <div className="mt-2 text-right text-xs text-gray-500">{brushSize}px</div>
                </div>
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-600">
              <button
                type="button"
                onClick={() => setShowMaskOverlay((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 hover:bg-gray-50"
              >
                {showMaskOverlay ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showMaskOverlay ? '隐藏遮罩预览' : '显示遮罩预览'}
              </button>
              <button
                type="button"
                onClick={clearMask}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 hover:bg-gray-50"
              >
                清除遮罩
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-semibold text-gray-600">风格与质感</label>
              <select className="w-full rounded-lg border border-gray-200 bg-white p-2 text-sm text-gray-700 focus:border-primary-400">
                <option value="photorealistic">写真级真实质感</option>
                <option value="digitalart">数字艺术 / 插画</option>
                <option value="sketch">线稿 / 草图风格</option>
                <option value="custom">自定义（后续开放）</option>
              </select>
            </div>
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-semibold text-gray-600">高阶选项</label>
              <div className="space-y-2 text-xs text-gray-500">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                  保护人物面部特征
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                  启用色彩一致性校准
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                  生成蒙版预览
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">实时预览与版本管理</h3>
            <p className="mt-2 text-xs text-gray-500">
              编辑操作会在左侧画布实时渲染，可在此保存多个版本以便回滚。企业版支持导出编辑日志与审批工作流。
            </p>
            <div className="mt-4 space-y-3">
              <button className="w-full btn secondary text-sm py-2">保存当前版本</button>
              {maskPreview && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-500">
                  <p className="font-semibold text-gray-700">遮罩预览</p>
                  <p className="mt-1">生成时将替换红色选区内的内容，保存以便下一次继续编辑。</p>
                  <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={maskPreview} alt="遮罩预览" className="h-32 w-full object-contain" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}
