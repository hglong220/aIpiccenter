/**
 * Type definitions for AI Pic Center
 */

// Generation Status
export type GenerationStatus = 'idle' | 'generating' | 'success' | 'error';

// Image Generation Types
export interface ImageGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  count: number;
  model?: string;
  referenceImage?: string;
  referenceImageName?: string;
}

export interface ImageGenerationResult {
  id: string;
  imageUrl: string;
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  createdAt: string;
}

// Video Generation Types
export interface VideoGenerationRequest {
  prompt: string;
  duration?: number;
  resolution?: string;
}

export interface VideoGenerationResult {
  id: string;
  videoUrl: string;
  prompt: string;
  duration: number;
  createdAt: string;
}

// Pricing Plans
export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  credits: number;
  features: string[];
  popular?: boolean;
  imageCredits: number; // 1 credit = 1 image
  videoCredits: number; // 10 credits = 1 video (adjustable)
  priority: 'standard' | 'high' | 'premium';
  maxResolution: string;
  advancedModels: boolean;
}

// User Case Study
export interface UserCase {
  id: string;
  imageUrl: string;
  videoUrl?: string;
  prompt: string;
  author: string;
  category: 'image' | 'video';
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface GenerationProgress {
  status: GenerationStatus;
  progress: number; // 0-100
  message?: string;
  result?: ImageGenerationResult | VideoGenerationResult;
}

// Form Types
export interface EnterpriseInquiry {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  requirements: string;
}

// User Types
export interface User {
  id: string;
  username?: string;
  phone: string;
  email?: string;
  credits: number;
  plan: string;
  planExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Authentication Types
export interface SendVerificationCodeRequest {
  phone: string;
  type: 'register' | 'login' | 'reset';
}

export interface RegisterRequest {
  phone: string;
  code: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  phone: string;
  code: string;
}

export interface ResetPasswordRequest {
  phone: string;
  code: string;
  newPassword: string;
}

export interface AuthResponse {
  user: User;
}

// Order Types
export interface CreateOrderRequest {
  planId: string;
  planName: string;
  amount: number;
  credits: number;
}

export interface Order {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  amount: number;
  credits: number;
  paymentMethod: string;
  paymentStatus: string;
  wechatOrderId?: string;
  transactionId?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Generation History Types
export interface GenerationHistory {
  id: string;
  userId: string;
  type: 'image' | 'video';
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  model?: string;
  imageUrl?: string;
  videoUrl?: string;
  creditsUsed: number;
  status: string;
  createdAt: string;
}

// Chat Types
export type ChatRole = 'user' | 'assistant'

export interface ChatSessionSummary {
  id: string
  title?: string
  isStarred: boolean
  createdAt: string
  updatedAt: string
  lastMessagePreview?: string
  messageCount: number
}

export interface ChatMessage {
  id: string
  chatId: string
  role: ChatRole
  content: string
  createdAt: string
  imagePath?: string
}

export interface ChatSessionDetail extends ChatSessionSummary {
  messages: ChatMessage[]
}


