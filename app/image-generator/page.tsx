'use client'

import { useCallback, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9'

const aspectOptions: Array<{ label: string; value: AspectRatio }> = [
  { label: '方形 1:1', value: '1:1' },
  { label: '竖屏 3:4', value: '3:4' },
  { label: '横屏 4:3', value: '4:3' },
  { label: '高清竖屏 9:16', value: '9:16' },
  { label: '高清横屏 16:9', value: '16:9' },
]

export default function ImageGeneratorPage() {
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1')
  const [images, setImages] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const disabled = useMemo(
    () => isGenerating || !prompt.trim(),
    [isGenerating, prompt]
  )

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return

    setIsGenerating(true)
    setImages([])

    try {
      const response = await fetch('/api/image-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
          negativePrompt: negativePrompt.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || '图像生成失败，请稍后再试')
      }

      const data = await response.json()

      if (!data.success || !data.data?.images?.length) {
        throw new Error(data.error || '未返回任何图像')
      }

      setImages(data.data.images as string[])
      toast.success(`生成成功，共 ${data.data.images.length} 张图像`)
    } catch (error) {
      console.error('生成图像出错:', error)
      toast.error(
        error instanceof Error ? error.message : '图像生成失败，请稍后再试'
      )
    } finally {
      setIsGenerating(false)
    }
  }, [aspectRatio, isGenerating, negativePrompt, prompt])

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: '#f9fafb',
      }}
    >
      <aside
        style={{
          width: '360px',
          borderRight: '1px solid #e5e7eb',
          backgroundColor: '#ffffff',
          padding: '32px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#111827', margin: 0 }}>
            文生图 · Imagen
          </h1>
          <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6, margin: 0 }}>
            输入你的创意描述，Gemini Imagen 将生成高质量图像。支持多种尺寸比例。
          </p>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#1f2937' }}>
            图像描述
          </span>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="例如：夕阳下的未来城市，霓虹灯闪烁，飞行汽车穿梭。"
            rows={6}
            style={{
              width: '100%',
              borderRadius: '12px',
              border: '1px solid #d1d5db',
              padding: '12px',
              resize: 'vertical',
              fontSize: '14px',
              lineHeight: 1.6,
              color: '#111827',
            }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#1f2937' }}>
            排除元素（可选）
          </span>
          <textarea
            value={negativePrompt}
            onChange={(event) => setNegativePrompt(event.target.value)}
            placeholder="例如：避免文字、文字过多、低质量。"
            rows={3}
            style={{
              width: '100%',
              borderRadius: '12px',
              border: '1px solid #d1d5db',
              padding: '12px',
              resize: 'vertical',
              fontSize: '14px',
              lineHeight: 1.6,
              color: '#111827',
            }}
          />
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#1f2937' }}>
            画面比例
          </span>
          <div
            style={{
              display: 'grid',
              gap: '8px',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            }}
          >
            {aspectOptions.map((option) => {
              const active = option.value === aspectRatio
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAspectRatio(option.value)}
                  style={{
                    padding: '10px',
                    borderRadius: '12px',
                    border: active ? '2px solid #2563eb' : '1px solid #d1d5db',
                    backgroundColor: active ? 'rgba(37, 99, 235, 0.08)' : '#ffffff',
                    color: active ? '#1d4ed8' : '#1f2937',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleGenerate()}
          disabled={disabled}
          style={{
            marginTop: 'auto',
            padding: '14px',
            borderRadius: '999px',
            border: 'none',
            backgroundColor: disabled ? '#d1d5db' : '#2563eb',
            color: '#ffffff',
            fontSize: '15px',
            fontWeight: 600,
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s ease',
          }}
        >
          {isGenerating ? '生成中…' : '生成图像'}
        </button>

        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px', lineHeight: 1.6 }}>
          提示：图像生成可能需要几秒钟。请确保描述具体清晰，以获得更理想的结果。
        </p>
      </aside>

      <section
        style={{
          flex: 1,
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', margin: 0 }}>生成结果</h2>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '6px 0 0', lineHeight: 1.6 }}>
              图片将展示在此处，你可以右键或点击保存。
            </p>
          </div>
        </header>

        <div
          style={{
            flex: 1,
            border: '1px dashed #d1d5db',
            borderRadius: '20px',
            backgroundColor: '#ffffff',
            padding: images.length ? '24px' : '0',
            display: 'grid',
            gridTemplateColumns: images.length > 1 ? 'repeat(auto-fit, minmax(220px, 1fr))' : '1fr',
            gap: '16px',
            placeItems: images.length ? undefined : 'center',
          }}
        >
          {images.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                color: '#9ca3af',
                fontSize: '14px',
                lineHeight: 1.7,
              }}
            >
              <p style={{ marginBottom: '8px' }}>图像预览将显示在这里。</p>
              <p style={{ margin: 0 }}> 输入描述并点击“生成图像”开始创作。 </p>
            </div>
          ) : (
            images.map((src, index) => (
              <figure
                key={`${src}-${index}`}
                style={{
                  margin: 0,
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#f3f4f6',
                  position: 'relative',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Generated image ${index + 1}`}
                  style={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </figure>
            ))
          )}
        </div>
      </section>
    </main>
  )
}


