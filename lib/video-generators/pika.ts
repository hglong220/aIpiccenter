/**
 * Pika 1.0 视频生成 API
 * 
 * 文档: https://docs.pika.art/
 */

export interface PikaConfig {
  apiKey: string
}

export interface PikaGenerationRequest {
  prompt: string
  imageUrl?: string
  duration?: number // 秒，默认 4
  aspectRatio?: '16:9' | '9:16' | '1:1'
  seed?: number
}

export interface PikaGenerationResponse {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  videoUrl?: string
  thumbnailUrl?: string
  progress?: number
  error?: string
}

/**
 * 创建视频生成任务
 */
export async function createPikaGeneration(
  config: PikaConfig,
  request: PikaGenerationRequest
): Promise<PikaGenerationResponse> {
  try {
    const response = await fetch('https://api.pika.art/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: request.prompt,
        image_url: request.imageUrl,
        duration: request.duration || 4,
        aspect_ratio: request.aspectRatio || '16:9',
        seed: request.seed,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error?.message || `API request failed: ${response.status}`)
    }

    const data = await response.json()
    return {
      id: data.id,
      status: data.status || 'pending',
      videoUrl: data.video_url,
      thumbnailUrl: data.thumbnail_url,
      progress: data.progress || 0,
    }
  } catch (error: any) {
    console.error('[Pika] Error creating generation:', error)
    throw new Error(`Pika API error: ${error.message}`)
  }
}

/**
 * 查询生成状态
 */
export async function getPikaGenerationStatus(
  config: PikaConfig,
  generationId: string
): Promise<PikaGenerationResponse> {
  try {
    const response = await fetch(`https://api.pika.art/v1/generations/${generationId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error?.message || `API request failed: ${response.status}`)
    }

    const data = await response.json()
    return {
      id: data.id,
      status: data.status || 'pending',
      videoUrl: data.video_url,
      thumbnailUrl: data.thumbnail_url,
      progress: data.progress || 0,
      error: data.error,
    }
  } catch (error: any) {
    console.error('[Pika] Error getting generation status:', error)
    throw new Error(`Pika API error: ${error.message}`)
  }
}

