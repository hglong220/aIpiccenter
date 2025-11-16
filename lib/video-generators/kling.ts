/**
 * Kling (字节跳动) 视频生成 API
 * 
 * 注意：API 文档可能需要根据实际服务调整
 */

export interface KlingConfig {
  apiKey: string
  apiSecret?: string
}

export interface KlingGenerationRequest {
  prompt: string
  imageUrl?: string
  duration?: number // 秒，默认 5
  aspectRatio?: '16:9' | '9:16' | '1:1'
  seed?: number
}

export interface KlingGenerationResponse {
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
export async function createKlingGeneration(
  config: KlingConfig,
  request: KlingGenerationRequest
): Promise<KlingGenerationResponse> {
  try {
    // 注意：实际 API 端点需要根据 Kling 官方文档调整
    const response = await fetch('https://api.klingai.com/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: request.prompt,
        image_url: request.imageUrl,
        duration: request.duration || 5,
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
      id: data.id || data.task_id,
      status: data.status || 'pending',
      videoUrl: data.video_url || data.videoUrl,
      thumbnailUrl: data.thumbnail_url || data.thumbnailUrl,
      progress: data.progress || 0,
    }
  } catch (error: any) {
    console.error('[Kling] Error creating generation:', error)
    throw new Error(`Kling API error: ${error.message}`)
  }
}

/**
 * 查询生成状态
 */
export async function getKlingGenerationStatus(
  config: KlingConfig,
  generationId: string
): Promise<KlingGenerationResponse> {
  try {
    const response = await fetch(`https://api.klingai.com/v1/generations/${generationId}`, {
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
      id: data.id || data.task_id,
      status: data.status || 'pending',
      videoUrl: data.video_url || data.videoUrl,
      thumbnailUrl: data.thumbnail_url || data.thumbnailUrl,
      progress: data.progress || 0,
      error: data.error,
    }
  } catch (error: any) {
    console.error('[Kling] Error getting generation status:', error)
    throw new Error(`Kling API error: ${error.message}`)
  }
}

