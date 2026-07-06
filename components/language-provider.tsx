'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type Locale = 'en' | 'hi' | 'pa' | 'mr' | 'gu' | 'te' | 'ta' | 'kn'

export const SUPPORTED_LOCALES: Locale[] = ['en', 'hi', 'pa', 'mr', 'gu', 'te', 'ta', 'kn']
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  hi: 'हिंदी',
  pa: 'ਪੰਜਾਬੀ',
  mr: 'मराठी',
  gu: 'ગુજરાતી',
  te: 'తెలుగు',
  ta: 'தமிழ்',
  kn: 'ಕನ್ನಡ',
}
export const LOCALE_SPEECH: Record<Locale, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  pa: 'pa-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  kn: 'kn-IN',
}

const baseDictionary = {
  en: {
    home: 'Home',
    products: 'Products',
    categories: 'Categories',
    about: 'About',
    account: 'Account',
    login: 'Login',
    orders: 'My Orders',
    wishlist: 'Wishlist',
    settings: 'Settings',
    addresses: 'Addresses',
    rewards: 'Rewards',
    notifications: 'Notifications',
    returns: 'Returns',
    logout: 'Logout',
    freeDelivery: 'Free delivery on orders above ₹999',
    genuine: '100% Genuine Products',
    trusted: 'Trusted by 10,000+ Farmers',
    searchPlaceholder: 'Search seeds, fertilizers, tools…',
    voiceSearch: 'Voice search',
    buyAgain: 'Buy again',
    subscribeSave: 'Subscribe & save',
    language: 'Language',
    accessibility: 'Accessibility',
    profileSettings: 'Profile settings',
    security: 'Security',
    farmProfile: 'Farm profile',
    accountDeletion: 'Account deletion',
    saveChanges: 'Save changes',
  },
  hi: {
    home: 'होम',
    products: 'उत्पाद',
    categories: 'श्रेणियाँ',
    about: 'हमारे बारे में',
    account: 'मेरा खाता',
    login: 'लॉगिन',
    orders: 'मेरे ऑर्डर',
    wishlist: 'पसंदीदा',
    settings: 'सेटिंग्स',
    addresses: 'पते',
    rewards: 'रिवॉर्ड',
    notifications: 'सूचनाएँ',
    returns: 'रिटर्न',
    logout: 'लॉगआउट',
    freeDelivery: '₹999 से अधिक के ऑर्डर पर मुफ्त डिलीवरी',
    genuine: '100% असली उत्पाद',
    trusted: '10,000+ किसानों का भरोसा',
    searchPlaceholder: 'बीज, खाद, उपकरण खोजें…',
    voiceSearch: 'आवाज़ से खोजें',
    buyAgain: 'फिर से खरीदें',
    subscribeSave: 'सब्सक्राइब करें और बचाएं',
    language: 'भाषा',
    accessibility: 'पहुंच',
    profileSettings: 'प्रोफ़ाइल सेटिंग्स',
    security: 'सुरक्षा',
    farmProfile: 'फार्म प्रोफ़ाइल',
    accountDeletion: 'अकाउंट डिलीशन',
    saveChanges: 'बदलाव सेव करें',
  },
  pa: {},
  mr: {},
  gu: {},
  te: {},
  ta: {},
  kn: {},
} as const

type Key = keyof typeof baseDictionary.en
const dictionary: Record<Locale, Partial<Record<Key, string>>> = baseDictionary
const fallbackDictionary = dictionary.en as Record<Key, string>
const LanguageContext = createContext<{ locale: Locale; toggle: () => void; t: (key: Key) => string }>({ locale: 'en', toggle: () => undefined, t: (key) => fallbackDictionary[key] })

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en')
  useEffect(() => {
    const saved = window.localStorage.getItem('kisanmart-language')
    if (saved && SUPPORTED_LOCALES.includes(saved as Locale)) queueMicrotask(() => setLocale(saved as Locale))
  }, [])
  useEffect(() => { document.documentElement.lang = locale; window.localStorage.setItem('kisanmart-language', locale) }, [locale])
  const value = useMemo(() => ({
    locale,
    toggle: () => setLocale((current) => {
      const index = SUPPORTED_LOCALES.indexOf(current)
      return SUPPORTED_LOCALES[(index + 1) % SUPPORTED_LOCALES.length]
    }),
    t: (key: Key) => dictionary[locale][key] ?? fallbackDictionary[key],
  }), [locale])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() { return useContext(LanguageContext) }
