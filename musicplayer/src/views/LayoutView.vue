<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMusicStore } from '@/stores/musicStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useI18n } from 'vue-i18n'
import MusicPlayer from '@/components/player/MusicPlayer.vue'

const router = useRouter()
const route = useRoute()
const musicStore = useMusicStore()
const settingsStore = useSettingsStore()
const { t } = useI18n()

// Get current route path
const currentRoute = computed(() => route.path)

// Navigation function
const navigateTo = (path) => {
  console.log('Navigating to:', path)
  router.push(path)
}

// Navigation items
const navItems = computed(() => [
  { name: t('app.home'), path: '/', icon: 'HomeFilled' },
  { name: t('library.title'), path: '/library', icon: 'Collection' },
  { name: t('playlist.title'), path: '/playlists', icon: 'Menu' },
  { name: t('library.favorites'), path: '/favorites', icon: 'Star' },
  { name: t('library.history'), path: '/history', icon: 'Clock' },
  { name: t('app.settings'), path: '/settings', icon: 'Setting' }
])

// Scan for music
const scanMusic = async () => {
  try {
    // 检查 electronAPI 是否可用
    if (window.electronAPI) {
      const folderPath = await window.electronAPI.openFolderDialog()
      if (folderPath) {
        console.log("Selected folder:", folderPath)
        const result = await musicStore.scanFolder(folderPath)
        console.log("Scan result:", result)
        
        if (result && result.success && result.trackCount > 0) {
          alert(t('messages.scanComplete') + ': ' + t('messages.tracksFound', { count: result.trackCount }))
        } else {
          alert(t('messages.errorScanningFolder'))
        }
      }
    } else {
      console.error("electronAPI not available - this application requires Electron to run properly")
      alert(t('messages.electronRequired'))
    }
  } catch (error) {
    console.error('Error scanning music folder:', error)
    alert(t('messages.errorScanningFolder') + ': ' + error.message)
  }
}

// 处理菜单中打开文件夹事件
const handleOpenFolder = async (folderPath) => {
  if (!folderPath) return
  
  try {
    console.log("Opening folder from menu:", folderPath)
    const result = await musicStore.scanFolder(folderPath)
    
    if (result && result.success && result.trackCount > 0) {
      alert(t('messages.scanComplete') + ': ' + t('messages.tracksFound', { count: result.trackCount }))
    } else {
      alert(t('messages.errorScanningFolder'))
    }
  } catch (error) {
    console.error('Error opening folder from menu:', error)
    alert(t('messages.errorScanningFolder') + ': ' + error.message)
  }
}

// 处理菜单中打开音乐文件事件
const handleOpenFiles = async (filePaths) => {
  if (!filePaths || filePaths.length === 0) return
  
  try {
    console.log("Opening files from menu:", filePaths)
    // 获取第一个文件的完整路径
    const firstFilePath = filePaths[0]
    // 让主进程处理文件
    const result = await musicStore.scanFolder(firstFilePath, true)
    
    if (result && result.success && result.trackCount > 0) {
      alert(t('messages.scanComplete') + ': ' + t('messages.tracksFound', { count: result.trackCount }))
    } else {
      alert(t('messages.fileNotFound'))
    }
  } catch (error) {
    console.error('Error opening files from menu:', error)
    alert(t('messages.errorLoadingTrack') + ': ' + error.message)
  }
}

// 添加拖放功能
const isDragging = ref(false)

const handleDragOver = (event) => {
  event.preventDefault()
  event.stopPropagation()
  isDragging.value = true
}

const handleDragLeave = (event) => {
  event.preventDefault()
  event.stopPropagation()
  isDragging.value = false
}

const handleDrop = async (event) => {
  event.preventDefault()
  event.stopPropagation()
  isDragging.value = false
  
  const items = event.dataTransfer.items
  if (items && items.length > 0) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry()
        if (entry && entry.isDirectory) {
          // 如果是文件夹，扫描这个文件夹
          try {
            const path = event.dataTransfer.files[i].path
            if (path) {
              console.log("Dropped folder:", path)
              const result = await musicStore.scanFolder(path)
              if (result && result.success && result.trackCount > 0) {
                alert(t('messages.scanComplete') + ': ' + t('messages.tracksFound', { count: result.trackCount }))
              } else {
                alert(t('messages.errorScanningFolder'))
              }
            }
          } catch (error) {
            console.error('Error scanning dropped folder:', error)
            alert(t('messages.errorScanningFolder') + ': ' + error.message)
          }
          break
        }
      }
    }
  }
}

// Register listeners for tray events
onMounted(() => {
  if (window.electronAPI) {
    // 菜单事件监听
    const removeOpenFolderListener = window.electronAPI.onOpenFolder((folderPath) => {
      handleOpenFolder(folderPath)
    })
    
    const removeOpenFilesListener = window.electronAPI.onOpenFiles((filePaths) => {
      handleOpenFiles(filePaths)
    })
    
    // 托盘事件监听
    const removePlayPauseListener = window.electronAPI.onTrayPlayPause(() => {
      musicStore.togglePlayPause()
    })
    
    const removeNextListener = window.electronAPI.onTrayNext(() => {
      musicStore.playNext()
    })
    
    const removePreviousListener = window.electronAPI.onTrayPrevious(() => {
      musicStore.playPrevious()
    })
    
    const removeGlobalPlayPauseListener = window.electronAPI.onGlobalPlayPause(() => {
      musicStore.togglePlayPause()
    })
    
    const removeGlobalNextListener = window.electronAPI.onGlobalNext(() => {
      musicStore.playNext()
    })
    
    const removeGlobalPreviousListener = window.electronAPI.onGlobalPrevious(() => {
      musicStore.playPrevious()
    })
    
    // Clean up listeners
    onUnmounted(() => {
      removeOpenFolderListener && removeOpenFolderListener()
      removeOpenFilesListener && removeOpenFilesListener()
      removePlayPauseListener && removePlayPauseListener()
      removeNextListener && removeNextListener()
      removePreviousListener && removePreviousListener()
      removeGlobalPlayPauseListener && removeGlobalPlayPauseListener()
      removeGlobalNextListener && removeGlobalNextListener()
      removeGlobalPreviousListener && removeGlobalPreviousListener()
    })
  }
  
  // Initialize audio
  musicStore.initAudio()
  
  // Load settings
  settingsStore.loadSettings()
  
  // Check if we need to load scan directories
  if (window.electronAPI) {
    window.electronAPI.getConfig().then(config => {
      if (config.scanFolders && config.scanFolders.length > 0) {
        config.scanFolders.forEach(folder => {
          musicStore.scanFolder(folder)
        })
      }
    }).catch(err => {
      console.error("Error getting config:", err)
    })
  } else {
    console.warn("electronAPI not available, scan directories will not be loaded")
  }
})

// Update lyrics when current track or time changes
watch(
  () => [musicStore.currentTrack, musicStore.currentTime], 
  async ([track], [oldTrack]) => {
    if (track && track !== oldTrack) {
      console.log('Current track changed, preparing to load lyrics:', track.title)
      
      // 确保先打开歌词窗口
      if (settingsStore.floatingLyricsEnabled && window.electronAPI) {
        try {
          console.log('Loading lyrics...')
          const lyrics = await musicStore.loadLyrics(track)
          
          // 确保歌词窗口已创建
          const isVisible = await window.electronAPI.toggleLyricsWindow()
          if (!isVisible) {
            // 如果窗口不可见，再次打开它
            await window.electronAPI.toggleLyricsWindow()
          }
          
          // 发送歌词数据
          const lyricsData = {
            title: track.title,
            artist: track.artist,
            lyrics: lyrics || []
          }
          
          console.log('Sending lyrics data to floating window:', 
            lyricsData.title, 
            lyricsData.lyrics.length ? `(${lyricsData.lyrics.length} lines)` : '(no lyrics)'
          )
          
          // 稍微延迟发送歌词，确保窗口已经准备好接收
          setTimeout(() => {
            window.electronAPI.updateLyrics(lyricsData)
          }, 500)
        } catch (error) {
          console.error('Error processing lyrics:', error)
        }
      }
    }
  }
)
</script>

<template>
  <div class="layout-container">
    <!-- Drop zone overlay -->
    <div 
      v-if="isDragging" 
      class="drop-zone-overlay"
      @dragover.prevent
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <div class="drop-zone-content">
        <el-icon class="drop-icon"><Upload /></el-icon>
        <div class="drop-text">{{ t('library.dropFolderHere') }}</div>
      </div>
    </div>
    
    <div 
      class="layout" 
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <!-- Sidebar -->
      <div class="sidebar">
        <div class="logo">
          <el-icon class="logo-icon"><Headset /></el-icon>
          <span>{{ t('app.name') }}</span>
        </div>
        
        <div class="nav-items">
          <div 
            v-for="item in navItems" 
            :key="item.path"
            :class="['nav-item', { active: currentRoute === item.path }]"
            @click="navigateTo(item.path)"
          >
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.name }}</span>
          </div>
        </div>
        
        <div class="add-music">
          <el-button type="primary" @click="scanMusic">
            <el-icon><Plus /></el-icon>
            <span>{{ t('library.addFolder') }}</span>
          </el-button>
        </div>
      </div>
      
      <!-- Main Content -->
      <div class="main">
        <!-- Content Area -->
        <div class="content">
          <router-view @add-music="scanMusic" />
        </div>
        
        <!-- Player Bar -->
        <div class="player-bar">
          <MusicPlayer />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.layout-container {
  height: 100vh;
  width: 100vw;
  position: relative;
  overflow: hidden;
}

.layout {
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.sidebar {
  width: 220px;
  min-width: 180px;
  height: 100%;
  background-color: var(--app-sidebar-color);
  border-right: 1px solid var(--app-border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
}

.logo {
  padding: 20px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--app-border-color);
}

.logo-icon {
  font-size: 24px;
  margin-right: 10px;
  color: var(--app-primary-color);
}

.logo span {
  font-size: 1.2rem;
  font-weight: bold;
}

.nav-items {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.nav-item {
  padding: 12px 20px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.nav-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.nav-item.active {
  background-color: rgba(64, 158, 255, 0.1);
  color: var(--app-primary-color);
  font-weight: bold;
}

.nav-item .el-icon {
  margin-right: 10px;
  font-size: 1.2rem;
}

.add-music {
  padding: 15px;
  border-top: 1px solid var(--app-border-color);
}

.add-music .el-button {
  width: 100%;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0; /* 重要：确保flex子项不会溢出 */
}

.content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0;
  width: 100%;
  height: calc(100% - 80px); /* 减去播放器高度 */
  display: flex; /* 使内容能够填满整个区域 */
  box-sizing: border-box;
  max-height: calc(100% - 80px);
}

.content > * {
  flex: 1;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

.player-bar {
  height: 80px;
  min-height: 80px;
  border-top: 1px solid var(--app-border-color);
  flex-shrink: 0;
  overflow: hidden; /* 防止内容溢出 */
  width: 100%;
  box-sizing: border-box;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Drop zone overlay */
.drop-zone-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.drop-zone-content {
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
}

.drop-icon {
  font-size: 48px;
  color: var(--app-primary-color);
  margin-bottom: 20px;
}

.drop-text {
  font-size: 18px;
  font-weight: bold;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .sidebar {
    width: 180px;
    min-width: 150px;
  }
  
  .nav-item {
    padding: 10px 15px;
  }
}

@media (max-width: 576px) {
  .sidebar {
    width: 60px;
    min-width: 60px;
  }
  
  .logo span {
    display: none;
  }
  
  .logo {
    justify-content: center;
    padding: 15px 0;
  }
  
  .logo-icon {
    margin-right: 0;
    font-size: 28px;
  }
  
  .nav-item span {
    display: none;
  }
  
  .nav-item {
    padding: 15px 0;
    justify-content: center;
  }
  
  .nav-item .el-icon {
    margin-right: 0;
    font-size: 1.4rem;
  }
  
  .add-music .el-button span {
    display: none;
  }
  
  .player-bar {
    height: auto; /* 允许播放器在小屏幕上自适应高度 */
    min-height: 120px; /* 确保有足够的空间显示控件 */
  }
}
</style> 