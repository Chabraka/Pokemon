import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { interpolate, messages } from './messages.js'

const STORAGE_KEY = 'pokemon-app-locale'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY)
      if (s === 'en' || s === 'fr') return s
    } catch {
      /* ignore */
    }
    return 'fr'
  })

  const setLocale = useCallback((next) => {
    if (next !== 'fr' && next !== 'en') return
    setLocaleState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale === 'fr' ? 'fr' : 'en'
    const title = messages[locale]?.['meta.title']
    if (title) document.title = title
  }, [locale])

  const t = useCallback(
    (key, vars) => {
      const safeLocale = locale === 'en' ? 'en' : 'fr'
      const raw =
        messages[safeLocale]?.[key] ?? messages.fr[key] ?? messages.en[key] ?? key
      return interpolate(raw, vars)
    },
    [locale]
  )

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  )

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
