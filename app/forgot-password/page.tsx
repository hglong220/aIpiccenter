'use client'

import { AuthForm } from '@/components/auth/AuthForm'

export default function ForgotPasswordPage() {
  return <AuthForm initialMode="forgot-password" redirect="/" />
}
