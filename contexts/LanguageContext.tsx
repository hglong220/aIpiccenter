'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Language } from '@/lib/i18n'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  toggleLanguage: () => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('zh')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load language from localStorage if available
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('language') as Language
      if (savedLang && (savedLang === 'en' || savedLang === 'zh')) {
        setLanguageState(savedLang)
      } else {
        // Default to Chinese
        setLanguageState('zh')
      }
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang)
    }
  }

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'zh' : 'en'
    setLanguage(newLang)
  }

  // Always provide context, even before mount to prevent hydration issues
  const contextValue = {
    language,
    setLanguage,
    toggleLanguage,
  }

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

