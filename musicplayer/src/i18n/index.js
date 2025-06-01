import { createI18n } from 'vue-i18n'
import en from './locales/en.js'
import zh from './locales/zh.js'

// Create i18n instance
const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: localStorage.getItem('language') || 'en', // Default language
  fallbackLocale: 'en', // Fallback language
  messages: {
    en,
    zh
  }
})

export default i18n

// Helper function to change language
export function setLanguage(lang) {
  i18n.global.locale.value = lang
  localStorage.setItem('language', lang)
  document.querySelector('html').setAttribute('lang', lang)
}

// Helper function to get current language
export function getLanguage() {
  return i18n.global.locale.value
}

// Helper function to get available languages
export function getAvailableLanguages() {
  return [
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文' }
  ]
} 