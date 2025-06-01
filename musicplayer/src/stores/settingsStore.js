import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { setLanguage } from '@/i18n'

export const useSettingsStore = defineStore('settings', () => {
  // State
  const theme = ref('light') // 'light', 'dark', 'auto'
  const language = ref(localStorage.getItem('language') || 'en') // Default language
  const visualizerEnabled = ref(true)
  const floatingLyricsEnabled = ref(false)
  const floatingLyricsOpacity = ref(0.8)
  const minimizeToTray = ref(true)
  const globalShortcuts = ref({
    playPause: 'CommandOrControl+Alt+P',
    next: 'CommandOrControl+Alt+Right',
    previous: 'CommandOrControl+Alt+Left'
  })
  
  // Load settings from electron-store
  async function loadSettings() {
    try {
      if (!window.electronAPI) {
        console.warn('electronAPI not available, using default settings')
        return
      }
      
      const config = await window.electronAPI.getConfig()
      if (config) {
        if (config.theme) theme.value = config.theme
        if (config.language) language.value = config.language
        if (config.visualizerEnabled !== undefined) visualizerEnabled.value = config.visualizerEnabled
        if (config.floatingLyricsEnabled !== undefined) floatingLyricsEnabled.value = config.floatingLyricsEnabled
        if (config.floatingLyricsOpacity) floatingLyricsOpacity.value = config.floatingLyricsOpacity
        if (config.minimizeToTray !== undefined) minimizeToTray.value = config.minimizeToTray
        if (config.globalShortcuts) globalShortcuts.value = { ...globalShortcuts.value, ...config.globalShortcuts }
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }
  
  // Save settings to electron-store
  function saveSettings() {
    if (!window.electronAPI) {
      console.warn('electronAPI not available, settings cannot be saved')
      return
    }
    
    try {
      // 创建一个简单的可序列化对象，只包含必要的原始数据类型
      const settings = {
        theme: String(theme.value),
        language: String(language.value),
        visualizerEnabled: Boolean(visualizerEnabled.value),
        floatingLyricsEnabled: Boolean(floatingLyricsEnabled.value),
        floatingLyricsOpacity: Number(floatingLyricsOpacity.value),
        minimizeToTray: Boolean(minimizeToTray.value),
        globalShortcuts: {
          playPause: String(globalShortcuts.value.playPause || ''),
          next: String(globalShortcuts.value.next || ''),
          previous: String(globalShortcuts.value.previous || '')
        }
      }
      
      console.log('Saving settings:', JSON.stringify(settings))
      
      // 确保数据可以序列化
      // 先尝试序列化，如果失败则会抛出错误
      JSON.stringify(settings)
      
      // 如果没有错误，保存设置
      window.electronAPI.updateConfig(settings)
        .then(() => console.log('Settings saved successfully'))
        .catch(error => console.error('Failed to save settings:', error))
    } catch (error) {
      console.error('Error preparing settings data:', error)
    }
  }
  
  // Set theme
  function setTheme(newTheme) {
    if (['light', 'dark', 'auto'].includes(newTheme)) {
      theme.value = newTheme
      applyTheme()
      saveSettings()
    }
  }
  
  // Set language
  function setAppLanguage(newLanguage) {
    language.value = newLanguage
    setLanguage(newLanguage)
    saveSettings()
  }
  
  // Apply theme
  function applyTheme() {
    const body = document.body
    
    // Remove existing theme classes
    body.classList.remove('theme-light', 'theme-dark')
    
    // Determine theme to apply
    let themeToApply = theme.value
    
    if (themeToApply === 'auto') {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      themeToApply = prefersDark ? 'dark' : 'light'
    }
    
    // Apply theme class
    body.classList.add(`theme-${themeToApply}`)
    
    // Apply CSS variables
    if (themeToApply === 'dark') {
      body.style.setProperty('--app-bg-color', '#1e1e1e')
      body.style.setProperty('--app-text-color', '#ffffff')
      body.style.setProperty('--app-border-color', '#444444')
      body.style.setProperty('--app-card-bg', '#2d2d2d')
      body.style.setProperty('--app-hover-bg', '#3a3a3a')
    } else {
      body.style.setProperty('--app-bg-color', '#f5f5f5')
      body.style.setProperty('--app-text-color', '#333333')
      body.style.setProperty('--app-border-color', '#e0e0e0')
      body.style.setProperty('--app-card-bg', '#ffffff')
      body.style.setProperty('--app-hover-bg', '#f0f0f0')
    }
  }
  
  // Toggle visualizer
  function toggleVisualizer() {
    visualizerEnabled.value = !visualizerEnabled.value
    saveSettings()
  }
  
  // Toggle floating lyrics
  function toggleFloatingLyrics() {
    floatingLyricsEnabled.value = !floatingLyricsEnabled.value
    saveSettings()
  }
  
  // Set floating lyrics opacity
  function setFloatingLyricsOpacity(opacity) {
    floatingLyricsOpacity.value = opacity
    saveSettings()
  }
  
  // Set minimize to tray
  function setMinimizeToTray(value) {
    minimizeToTray.value = value
    saveSettings()
  }
  
  // Update global shortcut
  function updateGlobalShortcut(action, shortcut) {
    if (globalShortcuts.value[action] !== undefined) {
      globalShortcuts.value[action] = shortcut
      saveSettings()
    }
  }
  
  // Reset settings to defaults
  function resetSettings() {
    theme.value = 'light'
    language.value = 'en'
    visualizerEnabled.value = true
    floatingLyricsEnabled.value = false
    floatingLyricsOpacity.value = 0.8
    minimizeToTray.value = true
    globalShortcuts.value = {
      playPause: 'CommandOrControl+Alt+P',
      next: 'CommandOrControl+Alt+Right',
      previous: 'CommandOrControl+Alt+Left'
    }
    
    applyTheme()
    setLanguage('en')
    saveSettings()
  }
  
  // Setup watchers
  watch(
    () => theme.value,
    () => applyTheme()
  )
  
  watch(
    () => language.value,
    (newLang) => setLanguage(newLang)
  )
  
  // Initialize
  loadSettings()
  applyTheme()
  
  return {
    // State
    theme,
    language,
    visualizerEnabled,
    floatingLyricsEnabled,
    floatingLyricsOpacity,
    minimizeToTray,
    globalShortcuts,
    
    // Actions
    loadSettings,
    saveSettings,
    setTheme,
    setAppLanguage,
    applyTheme,
    toggleVisualizer,
    toggleFloatingLyrics,
    setFloatingLyricsOpacity,
    setMinimizeToTray,
    updateGlobalShortcut,
    resetSettings
  }
}) 