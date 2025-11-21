/**
 * API Route: Enterprise Inquiry
 * 
 * This endpoint handles enterprise inquiry submissions.
 * 
 * POST /api/enterprise-inquiry
 * Body: EnterpriseInquiry
 * Response: ApiResponse
 */

import { NextRequest, NextResponse } from 'next/server'
import type { EnterpriseInquiry, ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body: EnterpriseInquiry = await request.json()

    // Validate required fields
    if (!body.companyName || !body.contactName || !body.email || !body.requirements) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'All required fields must be provided',
        },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Invalid email format',
        },
        { status: 400 }
      )
    }

    // TODO: Save inquiry to database or send to CRM/email service
    // For now, just log it
    console.log('Enterprise Inquiry:', body)

    // In production, you would:
    // 1. Save to database
    // 2. Send email notification
    // 3. Create ticket in CRM
    // 4. Send confirmation email to user

    return NextResponse.json<ApiResponse<null>>({
      success: true,
      message: 'Inquiry submitted successfully. We will contact you soon.',
    })
  } catch (error) {
    console.error('Error submitting inquiry:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json<ApiResponse<null>>(
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

