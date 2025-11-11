'use client'

import { Hero } from '@/components/gemini-landing/Hero'
import { KeyFeatures } from '@/components/gemini-landing/KeyFeatures'
import { Showcase } from '@/components/gemini-landing/Showcase'
import { TechDeepDive } from '@/components/gemini-landing/TechDeepDive'
import { FinalCTA } from '@/components/gemini-landing/FinalCTA'

export default function GeminiLandingPage() {
  return (
    <main className="bg-white">
      <Hero />
      <KeyFeatures />
      <Showcase />
      <TechDeepDive />
      <FinalCTA />
    </main>
  )
}








