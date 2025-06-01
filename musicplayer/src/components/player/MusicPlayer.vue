<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMusicStore } from '@/stores/musicStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useI18n } from 'vue-i18n'
import AudioVisualizer from './AudioVisualizer.vue'

const router = useRouter()
const musicStore = useMusicStore()
const settingsStore = useSettingsStore()
const { t } = useI18n()

// Computed properties
const currentTrack = computed(() => musicStore.currentTrack)
const isPlaying = computed(() => musicStore.isPlaying)
const duration = computed(() => {
  const audioDuration = musicStore.duration
  if (isNaN(audioDuration) || !isFinite(audioDuration) || audioDuration <= 0) {
    // 如果音频duration无效，但track有持续时间，则使用track的持续时间
    return currentTrack.value?.duration || 0
  }
  return audioDuration
})
const currentTime = computed(() => musicStore.currentTime)
const volume = computed(() => musicStore.volume)
const isMuted = computed(() => musicStore.isMuted)
const playbackMode = computed(() => musicStore.playbackMode)

// 本地可修改的状态，用于slider
const localCurrentTime = ref(0)
const localVolume = ref(0.7)

// 当musicStore中的时间和音量变化时，更新本地值
watch(() => musicStore.currentTime, (newTime) => {
  if (typeof newTime === 'number' && isFinite(newTime)) {
    localCurrentTime.value = newTime
    console.log('Updated local time:', newTime)
  }
})

watch(() => musicStore.volume, (newVolume) => {
  if (typeof newVolume === 'number' && isFinite(newVolume)) {
    localVolume.value = newVolume
  }
})

// 初始化本地值
onMounted(() => {
  if (typeof musicStore.currentTime === 'number' && isFinite(musicStore.currentTime)) {
    localCurrentTime.value = musicStore.currentTime
  }
  
  if (typeof musicStore.volume === 'number' && isFinite(musicStore.volume)) {
    localVolume.value = musicStore.volume
  }
  
  console.log('Initialized local values:', {
    currentTime: localCurrentTime.value,
    volume: localVolume.value,
    duration: duration.value
  })
})

// Format time (seconds to MM:SS)
const formatTime = (time) => {
  if (!time || typeof time !== 'number' || !isFinite(time) || time < 0) return '0:00'
  
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// Handle slider change
const onTimeChange = (value) => {
  musicStore.seek(value)
}

// Handle volume change
const onVolumeChange = (value) => {
  musicStore.setVolume(value)
}

// Toggle playback mode
const togglePlaybackMode = () => {
  const modes = ['sequential', 'repeat-one', 'shuffle']
  const currentIndex = modes.indexOf(playbackMode.value)
  const nextIndex = (currentIndex + 1) % modes.length
  musicStore.setPlaybackMode(modes[nextIndex])
}

// Get playback mode icon
const playbackModeIcon = computed(() => {
  switch (playbackMode.value) {
    case 'repeat-one':
      return 'Refresh'
    case 'shuffle':
      return 'Sort'
    default:
      return 'Operation'
  }
})

// Toggle floating lyrics
const toggleFloatingLyrics = () => {
  try {
    console.log('Toggling floating lyrics window')
    settingsStore.toggleFloatingLyrics()
  } catch (error) {
    console.error('Error toggling floating lyrics window:', error)
    // 如果出错，可能需要重置状态
    if (settingsStore.floatingLyricsEnabled) {
      settingsStore.floatingLyricsEnabled = false
    }
  }
}

// Navigate to full lyrics view
const navigateToLyricsView = () => {
  if (currentTrack.value) {
    router.push({ name: 'lyrics-full' })
  }
}

// Play/pause the current track
const togglePlayPause = () => {
  musicStore.togglePlayPause()
}

// Play the next track
const playNext = () => {
  musicStore.playNext()
}

// Play the previous track
const playPrevious = () => {
  musicStore.playPrevious()
}

// Toggle mute
const toggleMute = () => {
  musicStore.toggleMute()
}

// Get volume icon based on volume level
const volumeIcon = computed(() => {
  if (isMuted.value) return 'Mute'
  if (volume.value > 0.5) return 'VideoPlay'
  if (volume.value > 0) return 'VideoPause'
  return 'Mute'
})

// Toggle favorite status
const toggleFavorite = () => {
  if (currentTrack.value) {
    musicStore.toggleFavorite(currentTrack.value)
  }
}

// Check if current track is a favorite
const isFavorite = computed(() => {
  if (!currentTrack.value) return false
  return musicStore.isFavorite(currentTrack.value)
})

// Track image
const trackImage = computed(() => {
  if (currentTrack.value?.coverPath && window.electronAPI) {
    // 使用主进程处理文件URL
    try {
      // 直接在计算属性中使用异步可能不太好，但这里暂时这样处理
      // 更好的做法是在trackImage变化时设置一个异步加载
      return `file://${currentTrack.value.coverPath}`
    } catch (error) {
      console.error('Error loading cover image:', error)
    }
  }
  return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0Ij48cGF0aCBmaWxsPSJub25lIiBkPSJNMCAwaDI0djI0SDB6Ii8+PHBhdGggZD0iTTEyIDIyQzYuNDc3IDIyIDIgMTcuNTIzIDIgMTJTNi40NzcgMiAxMiAyYTkuOTcgOS45NyAwIDAgMSA3LjUwNiAzLjQzNWw0LTQuNDMyVjguMDY3bC00IDQuNDE0QTEwLjAyOCAxMC4wMjggMCAwIDEgMjIgMTJjMCA1LjUyMy00LjQ3NyAxMC0xMCAxMHptMC0yYTggOCAwIDEgMCAwLTE2IDggOCAwIDAgMCAwIDE2em0yLTRoLTVsLS41LS41di01bC41LS41SDEybDItMkg5djhoNmwtMi0yeiIgZmlsbD0iIzYwN2Q4YiIvPjwvc3ZnPgo='
})

// 处理进度条更新
const updateProgress = () => {
  // 确保传递有效的数值
  if (typeof localCurrentTime.value === 'number' && 
      isFinite(localCurrentTime.value) && 
      localCurrentTime.value !== currentTime.value) {
    console.log('Progress bar dragged to:', localCurrentTime.value)
    // 调用seek函数更新播放位置
    onTimeChange(localCurrentTime.value)
    
    // 触发自定义事件，通知其他组件时间已改变（这个事件会被LyricsFullView监听）
    window.dispatchEvent(new CustomEvent('music-time-changed', { 
      detail: { time: localCurrentTime.value } 
    }))
  }
}

// 处理音量更新
const updateVolume = () => {
  if (localVolume.value !== volume.value) {
    onVolumeChange(localVolume.value)
  }
}
</script>

<template>
  <div class="music-player">
    <!-- Track Info -->
    <div class="track-info">
      <div class="album-art" @click="navigateToLyricsView">
        <img :src="trackImage" :alt="t('player.albumArt')" />
        <div class="album-overlay">
          <el-icon><ZoomIn /></el-icon>
        </div>
      </div>
      <div class="track-details">
        <div class="track-title">{{ currentTrack?.title || t('player.noTrackPlaying') }}</div>
        <div class="track-artist">{{ currentTrack?.artist || '' }}</div>
      </div>
    </div>
    
    <!-- Player Controls -->
    <div class="player-controls">
      <!-- Control Buttons -->
      <div class="control-buttons">
        <el-button circle size="small" @click="togglePlaybackMode">
          <el-icon><component :is="playbackModeIcon" /></el-icon>
        </el-button>
        
        <el-button circle size="small" @click="playPrevious">
          <el-icon><Back /></el-icon>
        </el-button>
        
        <el-button circle type="primary" @click="togglePlayPause">
          <el-icon>
            <component :is="isPlaying ? 'VideoPause' : 'VideoPlay'" />
          </el-icon>
        </el-button>
        
        <el-button circle size="small" @click="playNext">
          <el-icon><Right /></el-icon>
        </el-button>
        
        <el-button circle size="small" @click="toggleFavorite">
          <el-icon>
            <component :is="isFavorite ? 'StarFilled' : 'Star'" />
          </el-icon>
        </el-button>
      </div>
      
      <!-- Progress Slider -->
      <div class="progress-container">
        <span class="time">{{ formatTime(currentTime) }}</span>
        <el-slider 
          v-model="localCurrentTime"
          :max="duration || 100" 
          :step="0.1"
          @change="updateProgress"
          :disabled="!currentTrack || duration <= 0"
        />
        <span class="time">{{ formatTime(duration) }}</span>
      </div>
    </div>
    
    <!-- Extra Controls -->
    <div class="extra-controls">
      <el-button 
        circle 
        size="small"
        :type="settingsStore.floatingLyricsEnabled ? 'primary' : 'default'"
        @click="toggleFloatingLyrics"
      >
        <el-icon><Document /></el-icon>
      </el-button>
      
      <div class="volume-control">
        <el-button circle size="small" @click="toggleMute">
          <el-icon><component :is="volumeIcon" /></el-icon>
        </el-button>
        
        <el-slider 
          v-model="localVolume" 
          :max="1" 
          :step="0.01"
          @change="updateVolume"
          class="volume-slider"
        />
      </div>
      
      <!-- Visualizer (only show when playing) -->
      <div v-if="settingsStore.visualizerEnabled && isPlaying" class="visualizer-container">
        <AudioVisualizer />
      </div>
    </div>
  </div>
</template>

<style scoped>
.music-player {
  display: flex;
  height: 100%;
  align-items: center;
  padding: 0 15px;
  background-color: var(--app-bg-color);
  overflow: hidden;
  flex-wrap: nowrap;
  box-sizing: border-box;
  width: 100%;
}

.track-info {
  display: flex;
  align-items: center;
  width: 220px;
  min-width: 160px;
  flex-shrink: 1;
  overflow: hidden;
  margin-right: 10px;
}

.album-art {
  width: 50px;
  height: 50px;
  min-width: 50px;
  margin-right: 10px;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.album-art:hover {
  transform: scale(1.05);
}

.album-art:hover .album-overlay {
  opacity: 1;
}

.album-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.album-overlay .el-icon {
  color: white;
  font-size: 20px;
}

.album-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.track-details {
  overflow: hidden;
  min-width: 0;
}

.track-title {
  font-weight: bold;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.9rem;
}

.track-artist {
  font-size: 0.8rem;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-controls {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 10px;
  min-width: 280px;
  overflow: hidden;
}

.control-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 5px;
  justify-content: center;
  flex-wrap: nowrap;
}

.progress-container {
  display: flex;
  align-items: center;
  width: 100%;
  margin-top: 3px;
}

.time {
  font-size: 0.75rem;
  color: var(--el-text-color-secondary);
  width: 35px;
  text-align: center;
  flex-shrink: 0;
}

.el-slider {
  flex: 1;
  margin: 0 5px;
  min-width: 80px;
}

.extra-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 220px;
  min-width: 140px;
  justify-content: flex-end;
  flex-shrink: 1;
  margin-left: 10px;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 5px;
}

.volume-slider {
  width: 70px;
  min-width: 40px;
}

.visualizer-container {
  width: 60px;
  height: 25px;
  flex-shrink: 0;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .track-info {
    width: 200px;
    min-width: 150px;
  }
  
  .player-controls {
    min-width: 250px;
  }
  
  .extra-controls {
    width: 200px;
    min-width: 130px;
  }
  
  .control-buttons {
    gap: 8px;
  }
}

@media (max-width: 992px) {
  .track-info {
    width: 180px;
    min-width: 130px;
  }
  
  .player-controls {
    min-width: 200px;
    padding: 0 5px;
  }
  
  .extra-controls {
    width: 180px;
    min-width: 110px;
    gap: 8px;
  }
  
  .volume-slider {
    width: 50px;
  }
  
  .control-buttons {
    gap: 6px;
  }
}

@media (max-width: 768px) {
  .music-player {
    padding: 0 8px;
  }
  
  .track-info {
    width: 160px;
    min-width: 110px;
  }
  
  .album-art {
    width: 45px;
    height: 45px;
    min-width: 45px;
    margin-right: 8px;
  }
  
  .player-controls {
    min-width: 160px;
    padding: 0 3px;
  }
  
  .extra-controls {
    width: 160px;
    min-width: 90px;
    gap: 6px;
  }
  
  .volume-slider {
    width: 45px;
  }
  
  .time {
    width: 30px;
  }
  
  .control-buttons {
    gap: 4px;
  }
}

@media (max-width: 576px) {
  .music-player {
    flex-wrap: wrap;
    padding: 5px;
    height: auto;
  }
  
  .track-info {
    width: 100%;
    margin-bottom: 5px;
    min-width: 100%;
    margin-right: 0;
  }
  
  .player-controls {
    width: 100%;
    order: 3;
    padding: 0;
    min-width: 100%;
  }
  
  .extra-controls {
    width: 100%;
    order: 2;
    justify-content: center;
    margin-bottom: 5px;
    min-width: 100%;
    margin-left: 0;
  }
  
  .visualizer-container {
    display: none;
  }
  
  .control-buttons {
    width: 100%;
    justify-content: space-between;
    padding: 0 10px;
  }
}
</style> 