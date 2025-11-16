/**
 * Runway Gen-3 视频生成 API
 * 
 * 文档: https://docs.runwayml.com/
 */

export interface RunwayConfig {
  apiKey: string
}

export interface RunwayGenerationRequest {
  prompt: string
  imageUrl?: string
  duration?: number // 秒，默认 5
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:5'
  seed?: number
}

export interface RunwayGenerationResponse {
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
export async function createRunwayGeneration(
  config: RunwayConfig,
  request: RunwayGenerationRequest
): Promise<RunwayGenerationResponse> {
  try {
    const response = await fetch('https://api.runwayml.com/v1/generations', {
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
      id: data.id,
      status: data.status || 'pending',
      videoUrl: data.video_url,
      thumbnailUrl: data.thumbnail_url,
      progress: data.progress || 0,
    }
  } catch (error: any) {
    console.error('[Runway] Error creating generation:', error)
    throw new Error(`Runway API error: ${error.message}`)
  }
}

/**
 * 查询生成状态
 */
export async function getRunwayGenerationStatus(
  config: RunwayConfig,
  generationId: string
): Promise<RunwayGenerationResponse> {
  try {
    const response = await fetch(`https://api.runwayml.com/v1/generations/${generationId}`, {
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
    console.error('[Runway] Error getting generation status:', error)
    throw new Error(`Runway API error: ${error.message}`)
  }
}

