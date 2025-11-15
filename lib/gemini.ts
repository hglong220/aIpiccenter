/**
 * Google Gemini API Integration
 * 
 * This module handles all interactions with the Gemini API
 * for image and video generation.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { fetch, ProxyAgent } from 'undici';
import type { 
  ImageGenerationRequest, 
  ImageGenerationResult,
  VideoGenerationRequest,
  VideoGenerationResult,
  GenerationProgress 
} from '@/types';

// Initialize Gemini client
let genAI: GoogleGenerativeAI | null = null;

/**
 * Initialize Gemini client with API key
 */
export function initializeGemini(apiKey: string): void {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
}

/**
 * Get Gemini client instance
 * Returns null if API key is not configured (for mock mode)
 */
function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your-gemini-api-key') {
    return null;
  }
  
  if (!genAI) {
    initializeGemini(apiKey);
  }
  return genAI;
}

/**
 * Enhance user prompt using Gemini AI
 * This helps users create better prompts for generation
 */
export async function enhancePrompt(userPrompt: string): Promise<string> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    
    // If no API key, return enhanced version using simple logic
    if (!apiKey || apiKey === 'your-gemini-api-key') {
      // Simple enhancement: add common quality indicators
      const enhanced = `${userPrompt}, highly detailed, professional quality, 4k resolution, best quality`;
      return enhanced;
    }
    
    // Get proxy agent if configured
    const proxyAgent = getProxyAgent();
    
    const enhancementPrompt = `
You are an expert AI prompt engineer. Enhance the following prompt for AI image/video generation to be more detailed, specific, and effective while maintaining the user's original intent.

Original prompt: "${userPrompt}"

Provide an enhanced version that includes:
- More specific visual details
- Style and mood descriptions
- Technical quality indicators
- Composition and framing details

Return only the enhanced prompt, nothing else.
`;

    const model = 'gemini-pro';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    // Prepare fetch options with proxy support
    const fetchOptions: {
      method: string;
      headers: Record<string, string>;
      body: string;
      dispatcher?: ProxyAgent;
    } = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: enhancementPrompt }],
          },
        ],
      }),
    };

    // Add proxy dispatcher if available
    if (proxyAgent) {
      fetchOptions.dispatcher = proxyAgent;
      console.info('[Gemini] Using proxy for prompt enhancement:', process.env.GEMINI_PROXY_URL || process.env.HTTPS_PROXY || process.env.HTTP_PROXY);
    }

    // Make API call using undici fetch (supports proxy)
    const response = await fetch(apiUrl, fetchOptions);

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorData}`);
    }

    const data = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || '')
      .join('\n')
      .trim();

    return text || `${userPrompt}, highly detailed, professional quality, 4k resolution, best quality`;
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    // Return enhanced version with simple additions if API fails
    return `${userPrompt}, highly detailed, professional quality, 4k resolution, best quality`;
  }
}

/**
 * Get proxy agent for API requests
 * Supports GCP proxy or other HTTP/HTTPS proxies
 */
function getProxyAgent(): ProxyAgent | undefined {
  const proxyUrl =
    process.env.GEMINI_PROXY_URL ||
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    null

  if (!proxyUrl) {
    return undefined
  }

  try {
    const agent = new ProxyAgent(proxyUrl)
    console.info('[Gemini] Proxy agent created for image generation:', proxyUrl)
    return agent
  } catch (error) {
    console.error('[Gemini] Failed to create proxy agent:', error)
    return undefined
  }
}

/**
 * Generate image using Google AI Studio API
 * 
 * This function integrates with Google AI Studio API for image generation.
 * Configure the API endpoint and authentication in environment variables:
 * - GOOGLE_AI_STUDIO_API_KEY: Your Google AI Studio API key
 * - GOOGLE_AI_STUDIO_API_URL: API endpoint URL (optional, defaults to official endpoint)
 * - HTTPS_PROXY or GEMINI_PROXY_URL: Proxy URL for accessing API (e.g., http://34.66.134.109:3128)
 */
export async function generateImage(
  request: ImageGenerationRequest,
  onProgress?: (progress: GenerationProgress) => void
): Promise<ImageGenerationResult> {
  try {
    // Get API key from environment variables
    const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'your-gemini-api-key') {
      throw new Error('Google AI Studio API key is not configured');
    }

    // Progress: Initializing
    onProgress?.({
      status: 'generating',
      progress: 0,
      message: 'Initializing generation...'
    });

    // Get proxy configuration
    const proxyUrl = process.env.GEMINI_PROXY_URL || process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    if (proxyUrl) {
      console.info('[Gemini] Using proxy for image generation:', proxyUrl);
    } else {
      console.warn('[Gemini] No proxy configured - direct connection may fail if network is blocked');
    }

    // TODO: Replace the following with your actual Google AI Studio API implementation
    // Example implementation (adjust based on actual API documentation):
    
    const apiUrl = process.env.GOOGLE_AI_STUDIO_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict';
    
    onProgress?.({
      status: 'generating',
      progress: 20,
      message: 'Processing your prompt...'
    });

    // Prepare request payload (adjust based on actual API requirements)
    const requestBody = {
      prompt: request.prompt,
      negativePrompt: request.negativePrompt,
      width: request.width,
      height: request.height,
      // Add other parameters as required by Google AI Studio API
    };

    // Get proxy agent if configured
    const proxyAgent = getProxyAgent();

    // Prepare fetch options with proxy support
    const fetchOptions: {
      method: string;
      headers: Record<string, string>;
      body: string;
      dispatcher?: ProxyAgent;
    } = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`, // Adjust authentication method if different
        // Or use: 'X-API-Key': apiKey, if API key goes in header
      },
      body: JSON.stringify(requestBody),
    };

    // Add proxy dispatcher if available
    if (proxyAgent) {
      fetchOptions.dispatcher = proxyAgent;
    }

    // Make API call using undici fetch (supports proxy)
    const response = await fetch(apiUrl, fetchOptions);

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({ error: 'Unknown error' }))) as { error?: string };
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }

    onProgress?.({
      status: 'generating',
      progress: 60,
      message: 'Generating image...'
    });

    const apiResponse = await response.json();
    
    // Extract image URL from API response (adjust based on actual response structure)
    // Example: const imageUrl = apiResponse.imageUrl || apiResponse.data?.imageUrl || apiResponse.images?.[0]?.url;
    const responseTyped = apiResponse as { id?: string; imageUrl?: string; data?: { imageUrl?: string }; images?: Array<{ url?: string }> };
    const imageUrl = responseTyped.imageUrl || responseTyped.data?.imageUrl || responseTyped.images?.[0]?.url;
    
    if (!imageUrl) {
      throw new Error('No image URL returned from API');
    }

    onProgress?.({
      status: 'generating',
      progress: 90,
      message: 'Finalizing...'
    });

    // Construct result
    const result: ImageGenerationResult = {
      id: responseTyped.id || `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      imageUrl: imageUrl,
      prompt: request.prompt,
      negativePrompt: request.negativePrompt,
      width: request.width,
      height: request.height,
      createdAt: new Date().toISOString(),
    };

    onProgress?.({
      status: 'success',
      progress: 100,
      result
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating image with Google AI Studio API:', error);
    onProgress?.({
      status: 'error',
      progress: 0,
      message: errorMessage
    });
    throw error;
  }
}

/**
 * Generate video using Gemini API
 * 
 * Note: This is a placeholder implementation.
 * Replace with actual Gemini video generation API calls when available.
 */
export async function generateVideo(
  request: VideoGenerationRequest,
  onProgress?: (progress: GenerationProgress) => void
): Promise<VideoGenerationResult> {
  try {
    // Simulate progress updates
    onProgress?.({
      status: 'generating',
      progress: 0,
      message: 'Initializing video generation...'
    });

    // TODO: Replace with actual Gemini video generation API
    // For now, this is a mock implementation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onProgress?.({
      status: 'generating',
      progress: 30,
      message: 'Processing your prompt...'
    });

    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onProgress?.({
      status: 'generating',
      progress: 60,
      message: 'Generating video...'
    });

    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onProgress?.({
      status: 'generating',
      progress: 90,
      message: 'Finalizing...'
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock result - Replace with actual API response
    const result: VideoGenerationResult = {
      id: `vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      videoUrl: `https://example.com/video/${Date.now()}.mp4`,
      prompt: request.prompt,
      duration: request.duration || 10,
      createdAt: new Date().toISOString(),
    };

    onProgress?.({
      status: 'success',
      progress: 100,
      result
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    onProgress?.({
      status: 'error',
      progress: 0,
      message: errorMessage
    });
    throw error;
  }
}
