import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { messages, type Language } from './messages'

const key = 'matrix-engine.language'
const LanguageContext = createContext<{
  language: Language
  select: (language: Language) => void
} | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    try { return localStorage.getItem(key) === 'de' ? 'de' : 'en' }
    catch { return 'en' }
  })
  useEffect(() => {
    document.documentElement.lang = language
    document.title = messages[language].pageTitle
  }, [language])
  function select(next: Language) {
    setLanguage(next)
    try { localStorage.setItem(key, next) } catch { /* Storage is optional in private contexts. */ }
  }
  return <LanguageContext.Provider value={{ language, select }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('Missing LanguageProvider')
  return { ...context, t: messages[context.language] }
}
