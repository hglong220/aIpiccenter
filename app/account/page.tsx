'use client'

import { redirect } from 'next/navigation'

export default function AccountPage() {
  redirect('/generate?view=settings')
}

