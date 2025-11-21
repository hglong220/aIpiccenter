/**
 * API Route: Enhance Prompt
 * 
 * This endpoint enhances user prompts using Gemini AI.
 * 
 * POST /api/enhance-prompt
 * Body: { prompt: string }
 * Response: { enhanced: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { enhancePrompt } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt } = body

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const enhanced = await enhancePrompt(prompt)

    return NextResponse.json({
      success: true,
      enhanced,
    })
  } catch (error) {
    console.error('Error enhancing prompt:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}


