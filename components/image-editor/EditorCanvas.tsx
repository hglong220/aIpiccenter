'use client'

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Stage, Layer, Image as KonvaImage, Line } from 'react-konva'
import type { Stage as StageType } from 'konva/lib/Stage'
import type { Layer as LayerType } from 'konva/lib/Layer'
import type { KonvaEventObject } from 'konva/lib/Node'

interface EditorCanvasProps {
  imageUrl?: string
  selectedTool: 'brush' | 'eraser'
  brushSize: number
  showMaskOverlay?: boolean
  onMaskUpdate?: (dataUrl: string | null) => void
}

export interface EditorCanvasHandle {
  clear: () => void
}

interface Stroke {
  tool: 'brush' | 'eraser'
  points: number[]
  strokeWidth: number
}

export const EditorCanvas = forwardRef<EditorCanvasHandle, EditorCanvasProps>(function EditorCanvas(
  { imageUrl, selectedTool, brushSize, showMaskOverlay = true, onMaskUpdate }: EditorCanvasProps,
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<StageType | null>(null)
  const maskLayerRef = useRef<LayerType | null>(null)

  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null)
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 1024, height: 1024 })
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({ width: 600, height: 600 })
  const [isDrawing, setIsDrawing] = useState(false)
  const [strokes, setStrokes] = useState<Stroke[]>([])

  // 加载原始图片
  useEffect(() => {
    if (!imageUrl) {
      setImageElement(null)
      return
    }

    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.src = imageUrl
    img.onload = () => {
      setImageElement(img)
      setImageSize({ width: img.width || 1024, height: img.height || 1024 })
    }
    img.onerror = () => {
      setImageElement(null)
    }

    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [imageUrl])

  // 根据容器宽度 & 图片比例自适应画布尺寸
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateSize = () => {
      const width = container.offsetWidth || 600
      const ratio = imageSize.width > 0 ? imageSize.height / imageSize.width : 1
      const height = width * ratio
      setStageSize({ width, height })
    }

    updateSize()

    const observer = new ResizeObserver(() => updateSize())
    observer.observe(container)

    return () => observer.disconnect()
  }, [imageSize])

  const handlePointerDown = () => {
    if (!stageRef.current) return
    const stage = stageRef.current
    const pointerPosition = stage.getPointerPosition()
    if (!pointerPosition) return

    setIsDrawing(true)
    setStrokes((prev) => [
      ...prev,
      {
        tool: selectedTool,
        points: [pointerPosition.x, pointerPosition.y],
        strokeWidth: brushSize,
      },
    ])
  }

  const handlePointerMove = () => {
    if (!isDrawing || !stageRef.current) return
    const stage = stageRef.current
    const pointerPosition = stage.getPointerPosition()
    if (!pointerPosition) return

    setStrokes((prev) => {
      const next = [...prev]
      const currentLine = next[next.length - 1]
      if (!currentLine) return prev

      currentLine.points = currentLine.points.concat([pointerPosition.x, pointerPosition.y])
      return next
    })
  }

  const handlePointerUp = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    requestAnimationFrame(() => emitMaskData())
  }

  const emitMaskData = () => {
    if (!maskLayerRef.current || !onMaskUpdate) return
    try {
      const canvas = maskLayerRef.current.getCanvas()._canvas as HTMLCanvasElement
      const dataUrl = canvas?.toDataURL('image/png') ?? null
      onMaskUpdate(dataUrl)
    } catch (error) {
      console.error('导出遮罩失败:', error)
    }
  }

  const handleStageRef = (node: StageType | null) => {
    stageRef.current = node
  }

  const handleMaskLayerRef = (node: LayerType | null) => {
    maskLayerRef.current = node
  }

  const clearMask = useCallback(() => {
    setStrokes([])
    onMaskUpdate?.(null)
  }, [onMaskUpdate])

  useImperativeHandle(ref, () => ({ clear: clearMask }), [clearMask])

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <Stage
          width={stageSize.width}
          height={stageSize.height}
          ref={handleStageRef}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          style={{ cursor: 'crosshair' }}
        >
          {/* 图片层 */}
          <Layer listening={false}>
            {imageElement && (
              <KonvaImage
                image={imageElement}
                width={stageSize.width}
                height={stageSize.height}
                perfectDrawEnabled={false}
              />
            )}
          </Layer>

          {/* 遮罩绘制层（用于导出） */}
          <Layer ref={handleMaskLayerRef} listening={false}>
            {strokes.map((stroke, index) => (
              <Line
                key={`mask-${index}`}
                points={stroke.points}
                stroke={stroke.tool === 'eraser' ? 'rgba(0,0,0,1)' : 'rgba(255,255,255,1)'}
                strokeWidth={stroke.strokeWidth}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation={stroke.tool === 'eraser' ? 'destination-out' : 'source-over'}
              />
            ))}
          </Layer>

          {/* 可视遮罩层（用户看到的高亮） */}
          {showMaskOverlay && (
            <Layer listening={false}>
              {strokes.map((stroke, index) => (
                <Line
                  key={`preview-${index}`}
                  points={stroke.points}
                  stroke={stroke.tool === 'eraser' ? 'rgba(0,0,0,0.0001)' : 'rgba(239,68,68,0.65)'}
                  strokeWidth={stroke.strokeWidth}
                  lineCap="round"
                  lineJoin="round"
                  shadowColor={stroke.tool === 'eraser' ? undefined : 'rgba(239,68,68,0.5)'}
                  shadowBlur={stroke.tool === 'eraser' ? 0 : 10}
                />
              ))}
            </Layer>
          )}
        </Stage>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>当前工具：{selectedTool === 'brush' ? '涂抹' : '擦除'} · 画笔大小 {brushSize}px</span>
        <button
          type="button"
          onClick={clearMask}
          className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 font-medium text-gray-600 hover:bg-gray-100"
        >
          清除涂抹
        </button>
      </div>
    </div>
  )
})
