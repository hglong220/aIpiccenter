/**
 * API Route: Generate Video
 * 
 * This endpoint handles video generation requests from the frontend.
 * It integrates with Google Gemini API for actual video generation.
 * 
 * POST /api/generate/video
 * Body: VideoGenerationRequest
 * Response: ApiResponse<VideoGenerationResult>
 */

import { NextRequest, NextResponse } from 'next/server'
import type { VideoGenerationRequest, ApiResponse, VideoGenerationResult } from '@/types'
import { generateVideo } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const body: VideoGenerationRequest = await request.json()

    // Validate request
    if (!body.prompt || !body.prompt.trim()) {
      return NextResponse.json<ApiResponse<VideoGenerationResult>>(
        {
          success: false,
          error: 'Prompt is required',
        },
        { status: 400 }
      )
    }

    // Generate video
    // Note: This is a placeholder. Replace with actual Gemini API call
    // Pass undefined for onProgress since we're in API route
    const result = await generateVideo(body, undefined)

    return NextResponse.json<ApiResponse<VideoGenerationResult>>({
      success: true,
      data: result,
      message: 'Video generated successfully',
    })
  } catch (error) {
    console.error('Error generating video:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json<ApiResponse<VideoGenerationResult>>(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

