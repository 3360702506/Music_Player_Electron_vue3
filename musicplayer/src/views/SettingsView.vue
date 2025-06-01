<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import { useMusicStore } from '@/stores/musicStore'
import { useI18n } from 'vue-i18n'
import { getAvailableLanguages } from '@/i18n'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

const settingsStore = useSettingsStore()
const musicStore = useMusicStore()
const { t } = useI18n()

// 使用本地响应式状态
const visualizerEnabled = ref(settingsStore.visualizerEnabled)
const lyricsEnabled = ref(settingsStore.floatingLyricsEnabled)
const lyricsOpacity = ref(settingsStore.floatingLyricsOpacity)
const minimizeToTray = ref(settingsStore.minimizeToTray)

// 同步处理函数
const handleThemeChange = (value) => {
  settingsStore.setTheme(value)
}

const handleVisualizerChange = (value) => {
  settingsStore.toggleVisualizer()
}

const handleLyricsChange = (value) => {
  settingsStore.toggleFloatingLyrics()
}

const handleLyricsOpacityChange = (value) => {
  settingsStore.setFloatingLyricsOpacity(value)
}

const handleMinimizeToTrayChange = (value) => {
  settingsStore.setMinimizeToTray(value)
}

// 当设置变化时更新本地状态
onMounted(() => {
  visualizerEnabled.value = settingsStore.visualizerEnabled
  lyricsEnabled.value = settingsStore.floatingLyricsEnabled
  lyricsOpacity.value = settingsStore.floatingLyricsOpacity
  minimizeToTray.value = settingsStore.minimizeToTray
})

// Theme settings
const themes = [
  { value: 'light' },
  { value: 'dark' },
  { value: 'auto' }
]

// Shortcut settings
const shortcuts = computed(() => {
  return [
    {
      action: 'playPause',
      shortcut: settingsStore.globalShortcuts.playPause
    },
    {
      action: 'nextTrack',
      shortcut: settingsStore.globalShortcuts.next
    },
    {
      action: 'previousTrack',
      shortcut: settingsStore.globalShortcuts.previous
    }
  ]
})

// Edit shortcut
const editingShortcut = ref(null)
const newShortcut = ref('')

const startEditShortcut = (shortcut) => {
  editingShortcut.value = shortcut
  newShortcut.value = shortcut.shortcut
}

const saveShortcut = () => {
  if (editingShortcut.value && newShortcut.value) {
    settingsStore.updateGlobalShortcut(editingShortcut.value.action, newShortcut.value)
    editingShortcut.value = null
  }
}

const cancelEditShortcut = () => {
  editingShortcut.value = null
}

// Add music folder
const addMusicFolder = async () => {
  try {
    if (window.electronAPI) {
      const result = await musicStore.scanFolder('')
      console.log("Scan result:", result)
    }
  } catch (error) {
    console.error("Error adding music folder:", error)
  }
}

// Scan folders
const scanFolders = computed(() => musicStore.scanDirectories)

// Reset settings
const confirmResetVisible = ref(false)

const resetSettings = () => {
  settingsStore.resetSettings()
  // 更新本地状态
  visualizerEnabled.value = settingsStore.visualizerEnabled
  lyricsEnabled.value = settingsStore.floatingLyricsEnabled
  lyricsOpacity.value = settingsStore.floatingLyricsOpacity
  minimizeToTray.value = settingsStore.minimizeToTray
  confirmResetVisible.value = false
}

// Language settings
const languages = getAvailableLanguages()

const handleLanguageChange = (lang) => {
  settingsStore.setAppLanguage(lang)
}
</script>

<template>
  <div class="settings">
    <h1>{{ t('settings.title') }}</h1>
    
    <!-- Theme Settings -->
    <div class="settings-section">
      <h2>{{ t('settings.theme.title') }}</h2>
      
      <div class="settings-group">
        <div class="settings-item">
          <span class="settings-label">{{ t('settings.theme.title') }}</span>
          <div class="settings-control">
            <el-radio-group v-model="settingsStore.theme" @change="handleThemeChange">
              <el-radio v-for="theme in themes" :key="theme.value" :label="theme.value">
                {{ t(`settings.theme.${theme.value}`) }}
              </el-radio>
            </el-radio-group>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Playback Settings -->
    <div class="settings-section">
      <h2>{{ t('settings.audio.title') }}</h2>
      
      <div class="settings-group">
        <div class="settings-item">
          <span class="settings-label">{{ t('player.visualizer') }}</span>
          <div class="settings-control">
            <el-switch
              v-model="visualizerEnabled"
              @change="handleVisualizerChange"
              active-color="#409EFF"
            />
          </div>
        </div>
        
        <div class="settings-item">
          <span class="settings-label">{{ t('player.lyrics') }}</span>
          <div class="settings-control">
            <el-switch
              v-model="lyricsEnabled"
              @change="handleLyricsChange"
              active-color="#409EFF"
            />
          </div>
        </div>
        
        <div class="settings-item" v-if="lyricsEnabled">
          <span class="settings-label">{{ t('player.lyricsOpacity') }}</span>
          <div class="settings-control">
            <el-slider 
              v-model="lyricsOpacity" 
              :min="0.1" 
              :max="1" 
              :step="0.1"
              @change="handleLyricsOpacityChange"
              style="width: 200px"
            />
            <span>{{ Math.round(lyricsOpacity * 100) }}%</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- System Settings -->
    <div class="settings-section">
      <h2>{{ t('settings.advanced.title') }}</h2>
      
      <div class="settings-group">
        <div class="settings-item">
          <span class="settings-label">{{ t('settings.minimizeToTray') }}</span>
          <div class="settings-control">
            <el-switch
              v-model="minimizeToTray"
              @change="handleMinimizeToTrayChange"
              active-color="#409EFF"
            />
          </div>
        </div>
        
        <div class="settings-item">
          <span class="settings-label">{{ t('settings.shortcuts.title') }}</span>
          <div class="shortcuts-list">
            <div v-for="shortcut in shortcuts" :key="shortcut.action" class="shortcut-item">
              <span class="shortcut-label">{{ t(`settings.shortcuts.${shortcut.action}`) }}</span>
              
              <div v-if="editingShortcut === shortcut" class="shortcut-edit">
                <el-input 
                  v-model="newShortcut" 
                  :placeholder="t('settings.shortcuts.typeNew')" 
                  class="shortcut-input"
                />
                <div class="shortcut-actions">
                  <el-button size="small" @click="saveShortcut">{{ t('app.save') }}</el-button>
                  <el-button size="small" @click="cancelEditShortcut">{{ t('app.cancel') }}</el-button>
                </div>
              </div>
              
              <div v-else class="shortcut-display">
                <span class="shortcut-value">{{ shortcut.shortcut }}</span>
                <el-button size="small" @click="startEditShortcut(shortcut)">{{ t('app.edit') }}</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Music Folders -->
    <div class="settings-section">
      <h2>{{ t('library.folders') }}</h2>
      
      <div class="settings-group">
        <div class="scan-folders">
          <div v-if="scanFolders.length > 0" class="folders-list">
            <div v-for="(folder, index) in scanFolders" :key="index" class="folder-item">
              <el-icon><Folder /></el-icon>
              <span class="folder-path">{{ folder }}</span>
            </div>
          </div>
          
          <el-empty v-else :description="t('library.noFolders')" />
          
          <el-button type="primary" @click="addMusicFolder">
            <el-icon><FolderAdd /></el-icon>
            {{ t('library.addFolder') }}
          </el-button>
        </div>
      </div>
    </div>
    
    <!-- Language Settings -->
    <div class="settings-section">
      <h2>{{ t('settings.language') }}</h2>
      
      <div class="settings-group">
        <div class="settings-item">
          <span class="settings-label">{{ t('settings.language') }}</span>
          <div class="settings-control">
            <el-select 
              v-model="settingsStore.language" 
              @change="handleLanguageChange"
              style="width: 150px"
            >
              <el-option 
                v-for="lang in languages" 
                :key="lang.code" 
                :label="lang.name" 
                :value="lang.code" 
              />
            </el-select>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Reset Settings -->
    <div class="settings-section">
      <div class="settings-group">
        <div class="settings-item">
          <el-button type="danger" @click="confirmResetVisible = true">
            {{ t('settings.advanced.resetSettings') }}
          </el-button>
        </div>
      </div>
    </div>
    
    <!-- Reset Confirmation Dialog -->
    <el-dialog
      v-model="confirmResetVisible"
      :title="t('settings.advanced.resetSettings')"
      width="30%"
    >
      <p>{{ t('settings.confirmReset') }}</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="confirmResetVisible = false">{{ t('app.cancel') }}</el-button>
          <el-button type="danger" @click="resetSettings">{{ t('settings.advanced.reset') }}</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.settings {
  padding: 20px;
  max-width: 100%;
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

h1 {
  font-size: 24px;
  margin-bottom: 20px;
}

.settings-section {
  margin-bottom: 30px;
  width: 100%;
  max-width: 800px;
}

h2 {
  font-size: 18px;
  margin-bottom: 15px;
  color: var(--app-text-color);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--app-border-color);
}

.settings-group {
  padding: 0 10px;
}

.settings-item {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  width: 100%;
}

.settings-label {
  flex: 1;
  font-weight: 500;
}

.settings-control {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 200px;
}

.shortcuts-list {
  width: 100%;
  margin-top: 10px;
}

.shortcut-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--app-border-color);
}

.shortcut-item:last-child {
  border-bottom: none;
}

.shortcut-edit {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 60%;
}

.shortcut-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.shortcut-display {
  display: flex;
  align-items: center;
  gap: 10px;
}

.shortcut-value {
  background-color: var(--el-fill-color-lighter);
  padding: 5px 10px;
  border-radius: 4px;
  font-family: monospace;
}

.scan-folders {
  margin-top: 10px;
  width: 100%;
}

.folders-list {
  margin-bottom: 15px;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--app-border-color);
  border-radius: 4px;
  padding: 5px;
  width: 100%;
}

.folder-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-bottom: 1px solid var(--app-border-color);
  width: 100%;
}

.folder-item:last-child {
  border-bottom: none;
}

.folder-path {
  word-break: break-all;
  flex: 1;
}
</style> 