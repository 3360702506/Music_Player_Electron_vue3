<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMusicStore } from '@/stores/musicStore'
import { useSettingsStore } from '@/stores/settingsStore'

const router = useRouter()
const musicStore = useMusicStore()
const settingsStore = useSettingsStore()

// Lyrics data
const lyrics = ref([])
const currentLyricIndex = ref(-1)

// 本地可修改的状态，用于slider
const localCurrentTime = ref(0)

// Computed properties for current track
const currentTrack = computed(() => musicStore.currentTrack)
const isPlaying = computed(() => musicStore.isPlaying)
const duration = computed(() => {
  const audioDuration = musicStore.duration
  if (isNaN(audioDuration) || !isFinite(audioDuration) || audioDuration <= 0) {
    return currentTrack.value?.duration || 0
  }
  return audioDuration
})

// 当musicStore中的时间变化时，更新本地值
watch(() => musicStore.currentTime, (newTime) => {
  if (typeof newTime === 'number' && isFinite(newTime)) {
    localCurrentTime.value = newTime
  }
})

// Track image with blur background
const trackImage = computed(() => {
  if (currentTrack.value?.coverPath && window.electronAPI) {
    return `file://${currentTrack.value.coverPath}`
  }
  return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0Ij48cGF0aCBmaWxsPSJub25lIiBkPSJNMCAwaDI0djI0SDB6Ii8+PHBhdGggZD0iTTEyIDIyQzYuNDc3IDIyIDIgMTcuNTIzIDIgMTJTNi40NzcgMiAxMiAyYTkuOTcgOS45NyAwIDAgMSA3LjUwNiAzLjQzNWw0LTQuNDMyVjguMDY3bC00IDQuNDE0QTEwLjAyOCAxMC4wMjggMCAwIDEgMjIgMTJjMCA1LjUyMy00LjQ3NyAxMC0xMCAxMHptMC0yYTggOCAwIDEgMCAwLTE2IDggOCAwIDAgMCAwIDE2em0yLTRoLTVsLS41LS41di01bC41LS41SDEybDItMkg5djhoNmwtMi0yeiIgZmlsbD0iIzYwN2Q4YiIvPjwvc3ZnPgo='
})

// Go back to previous page
const goBack = () => {
  // 在返回前进行清理
  try {
    console.log('正在退出歌词视图，清理资源...')
    
    // 停止定时器和事件监听
    if (window._lyricsTimer) {
      clearInterval(window._lyricsTimer)
      window._lyricsTimer = null
      console.log('已清理歌词定时器')
    }
    
    // 移除事件监听器
    window.removeEventListener('music-time-changed', handleTimeChange)
    console.log('已移除时间变化事件监听器')
    
    // 确保不再引用DOM元素
    const currentElements = document.querySelectorAll('.lyric-line.current')
    currentElements.forEach(el => {
      el.classList.remove('current')
    })
    
    // 释放其他资源
    lyrics.value = []
    currentLyricIndex.value = -1
    
    // 重要：确保不影响音乐播放状态
    const wasPlaying = musicStore.isPlaying
    
    // 返回上一页
    router.back()
    
    // 如果之前在播放，确保继续播放
    if (wasPlaying && !musicStore.isPlaying) {
      console.log('检测到播放状态丢失，恢复播放')
      setTimeout(() => {
        musicStore.play()
      }, 100)
    }
  } catch (error) {
    console.error('清理歌词视图资源时出错:', error)
    // 出错时也要返回
    router.back()
  }
}

// Toggle play/pause
const togglePlayPause = () => {
  musicStore.togglePlayPause()
}

// Play next track
const playNext = () => {
  musicStore.playNext()
}

// Play previous track
const playPrevious = () => {
  musicStore.playPrevious()
}

// Format time (seconds to MM:SS)
const formatTime = (time) => {
  if (!time || typeof time !== 'number' || !isFinite(time) || time < 0) return '0:00'
  
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// 处理进度条更新
const updateProgress = () => {
  // 确保传递有效的数值
  if (typeof localCurrentTime.value === 'number' && 
      isFinite(localCurrentTime.value) && 
      localCurrentTime.value !== musicStore.currentTime) {
    musicStore.seek(localCurrentTime.value)
    // 立即更新当前歌词位置，不等待时间变化事件
    updateCurrentLyric(localCurrentTime.value)
    // 滚动到当前歌词
    scrollToCurrentLyric()
  }
}

// 使用musicStore加载真实歌词
const loadLyrics = async () => {
  if (!currentTrack.value) {
    console.log('没有当前播放曲目，无法加载歌词')
    lyrics.value = []
    return
  }
  
  console.log('开始加载歌词，曲目:', currentTrack.value.title)
  
  try {
    // 使用musicStore中的loadLyrics函数加载歌词
    const lyricsData = await musicStore.loadLyrics(currentTrack.value)
    
    if (lyricsData && lyricsData.length > 0) {
      console.log('成功加载歌词，行数:', lyricsData.length)
      lyrics.value = lyricsData
      // 立即更新当前歌词
      updateCurrentLyric()
    } else {
      console.warn('未找到歌词或歌词为空，使用模拟歌词')
      // 如果没有找到歌词，创建模拟歌词
      createDummyLyrics()
    }
  } catch (error) {
    console.error('加载歌词出错:', error)
    // 出错时使用模拟歌词
    createDummyLyrics()
  }
}

// 创建模拟歌词（当找不到真实歌词时使用）
const createDummyLyrics = () => {
  if (!currentTrack.value) return
  
  const duration = musicStore.duration || currentTrack.value.duration || 0
  const dummyLyrics = []
  
  // 创建一些模拟歌词行
  dummyLyrics.push({ time: 0, text: `${currentTrack.value.title}` })
  dummyLyrics.push({ time: 3, text: `演唱: ${currentTrack.value.artist || '未知'}` })
  dummyLyrics.push({ time: 6, text: `专辑: ${currentTrack.value.album || '未知'}` })
  dummyLyrics.push({ time: 9, text: '未找到歌词文件' })
  dummyLyrics.push({ time: 12, text: '请将LRC歌词文件放在音乐文件同目录下' })
  dummyLyrics.push({ time: 15, text: '文件名格式: 歌名.lrc 或 歌手 - 歌名.lrc' })
  
  // 每15秒添加一行
  for (let i = 30; i < duration; i += 15) {
    dummyLyrics.push({
      time: i,
      text: `♪ ${currentTrack.value.title} - ${formatTime(i)} ♪`
    })
  }
  
  lyrics.value = dummyLyrics
  console.log('已创建模拟歌词，行数:', dummyLyrics.length)
  
  // 立即更新当前歌词
  updateCurrentLyric()
}

// Update current lyric based on current time
const updateCurrentLyric = (specificTime) => {
  if (!lyrics.value || lyrics.value.length === 0) return
  
  let index = -1
  // 使用传入的特定时间（用于拖动进度条后）或当前播放时间
  const currentTime = specificTime !== undefined ? specificTime : musicStore.currentTime
  
  // 重新实现查找算法，确保找到正确的歌词行
  for (let i = lyrics.value.length - 1; i >= 0; i--) {
    if (lyrics.value[i].time <= currentTime) {
      index = i;
      break;
    }
  }
  
  // Only update if the index has changed
  if (index !== currentLyricIndex.value) {
    currentLyricIndex.value = index
    
    // Auto-scroll to the current lyric
    if (index !== -1) {
      scrollToCurrentLyric()
    }
  }
}

// 滚动到当前歌词
const scrollToCurrentLyric = () => {
  setTimeout(() => {
    const currentElement = document.querySelector('.lyric-line.current')
    if (currentElement) {
      currentElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }
  }, 100)
}

// 处理音乐时间变化事件（进度条拖动）
const handleTimeChange = (event) => {
  console.log('收到时间变化事件:', event.detail.time)
  // 立即更新当前歌词
  updateCurrentLyric(event.detail.time)
  // 滚动到当前歌词
  scrollToCurrentLyric()
}

// Watch for changes in the current track
watch(() => currentTrack.value, (newTrack) => {
  if (newTrack) {
    loadLyrics()
    // 初始化本地时间
    localCurrentTime.value = musicStore.currentTime
  }
}, { immediate: true })

// Watch for changes in current time to update the lyrics
watch(() => musicStore.currentTime, () => {
  updateCurrentLyric()
})

onMounted(() => {
  // 初始化本地时间
  localCurrentTime.value = musicStore.currentTime
  
  // Load lyrics when component is mounted
  loadLyrics()
  
  // 监听进度条拖动事件
  window.addEventListener('music-time-changed', handleTimeChange)
  
  // 监听页面卸载事件，确保资源被释放
  const handleBeforeUnload = () => {
    console.log('页面即将卸载，确保资源被释放')
    
    // 保存当前播放状态
    const wasPlaying = musicStore.isPlaying
    
    // 清理资源
    if (window._lyricsTimer) {
      clearInterval(window._lyricsTimer)
      window._lyricsTimer = null
    }
    
    window.removeEventListener('music-time-changed', handleTimeChange)
    
    // 如果播放被中断，尝试恢复
    if (wasPlaying) {
      try {
        musicStore.play()
      } catch (error) {
        console.error('尝试恢复播放失败:', error)
      }
    }
  }
  
  window.addEventListener('beforeunload', handleBeforeUnload)
  
  // Set up timer to update current lyric
  const timer = setInterval(() => {
    updateCurrentLyric()
  }, 100)
  
  // 保存定时器引用，以便可以在其他地方清理
  window._lyricsTimer = timer
  
  // 清理函数
  onUnmounted(() => {
    // 移除beforeunload事件监听器
    window.removeEventListener('beforeunload', handleBeforeUnload)
    
    console.log('LyricsFullView组件卸载，清理资源')
    
    // 保存当前播放状态
    const wasPlaying = musicStore.isPlaying
    
    // 清理定时器
    if (window._lyricsTimer) {
      clearInterval(window._lyricsTimer)
      window._lyricsTimer = null
      console.log('组件卸载：已清理歌词定时器')
    }
    
    // 移除事件监听器
    window.removeEventListener('music-time-changed', handleTimeChange)
    console.log('组件卸载：已移除时间变化事件监听器')
    
    // 重置状态
    try {
      currentLyricIndex.value = -1
      lyrics.value = []
      
      // 确保不再引用DOM元素
      const currentElements = document.querySelectorAll('.lyric-line.current')
      currentElements.forEach(el => {
        el.classList.remove('current')
      })
    } catch (error) {
      console.error('组件卸载：清理歌词视图资源时出错:', error)
    }
    
    // 如果组件卸载导致播放停止，恢复播放
    setTimeout(() => {
      if (wasPlaying && !musicStore.isPlaying) {
        console.log('组件卸载：检测到播放状态丢失，恢复播放')
        musicStore.play()
      }
    }, 200)
  })
})
</script>

<template>
  <div class="lyrics-full-view">
    <!-- Blurred background -->
    <div class="background-blur" :style="{ backgroundImage: `url(${trackImage})` }"></div>
    
    <!-- Content container -->
    <div class="content-container">
      <!-- Header with back button -->
      <div class="header">
        <el-button circle @click="goBack">
          <el-icon><Back /></el-icon>
        </el-button>
        <div class="track-info">
          <div class="track-title">{{ currentTrack?.title || 'No track playing' }}</div>
          <div class="track-artist">{{ currentTrack?.artist || '' }}</div>
        </div>
      </div>
      
      <!-- Album art -->
      <div class="album-art-container">
        <div class="album-art" :class="{ 'rotating': isPlaying }">
          <img :src="trackImage" alt="Album Art" />
        </div>
      </div>
      
      <!-- Lyrics container -->
      <div class="lyrics-container">
        <div v-if="lyrics && lyrics.length > 0" class="lyrics-text">
          <div 
            v-for="(lyric, index) in lyrics" 
            :key="index"
            :class="{
              'lyric-line': true,
              'current': index === currentLyricIndex,
              'past': index < currentLyricIndex,
              'future': index > currentLyricIndex
            }"
          >
            {{ lyric.text }}
          </div>
        </div>
        
        <div v-else class="no-lyrics">
          No lyrics found
        </div>
      </div>
      
      <!-- Player controls with progress bar -->
      <div class="player-controls">
        <!-- Progress Slider -->
        <div class="progress-container">
          <span class="time">{{ formatTime(musicStore.currentTime) }}</span>
          <el-slider 
            v-model="localCurrentTime"
            :max="duration || 100" 
            :step="0.1"
            @change="updateProgress"
            :disabled="!currentTrack || duration <= 0"
          />
          <span class="time">{{ formatTime(duration) }}</span>
        </div>
        
        <!-- Control Buttons -->
        <div class="control-buttons">
          <el-button circle @click="playPrevious">
            <el-icon><Back /></el-icon>
          </el-button>
          
          <el-button circle type="primary" size="large" @click="togglePlayPause">
            <el-icon>
              <component :is="isPlaying ? 'VideoPause' : 'VideoPlay'" />
            </el-icon>
          </el-button>
          
          <el-button circle @click="playNext">
            <el-icon><Right /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lyrics-full-view {
  position: relative;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  color: white;
  display: flex;
  flex-direction: column;
}

.background-blur {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  filter: blur(30px);
  opacity: 0.7;
  z-index: 1;
}

.content-container {
  position: relative;
  z-index: 2;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background-color: rgba(0, 0, 0, 0.5);
  box-sizing: border-box;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  min-height: 40px;
}

.track-info {
  margin-left: 15px;
  overflow: hidden;
}

.track-title {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-artist {
  font-size: 0.9rem;
  opacity: 0.8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.album-art-container {
  display: flex;
  justify-content: center;
  margin: 10px 0;
  flex-shrink: 0;
}

.album-art {
  width: 200px;
  height: 200px;
  border-radius: 100px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  transition: transform 0.5s ease;
}

@media (max-height: 700px) {
  .album-art {
    width: 150px;
    height: 150px;
    border-radius: 75px;
  }
}

@media (max-height: 600px) {
  .album-art {
    width: 120px;
    height: 120px;
    border-radius: 60px;
  }
}

.album-art.rotating {
  animation: rotate 20s linear infinite;
}

.album-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.lyrics-container {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10px 0;
  min-height: 100px;
}

.lyrics-text {
  width: 100%;
  max-width: 600px;
  text-align: center;
}

.lyric-line {
  padding: 8px 0;
  transition: all 0.3s ease;
  opacity: 0.6;
  font-size: 16px;
  margin: 3px 0;
}

.lyric-line.past {
  opacity: 0.4;
  font-size: 14px;
}

.lyric-line.current {
  opacity: 1;
  font-size: 20px;
  font-weight: bold;
  color: #ffffff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.7);
}

.lyric-line.future {
  opacity: 0.5;
  font-size: 15px;
}

.no-lyrics {
  text-align: center;
  opacity: 0.7;
  font-style: italic;
  padding: 20px;
}

.player-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
  margin-top: auto;
  flex-shrink: 0;
}

.control-buttons {
  display: flex;
  gap: 20px;
  margin: 10px 0;
}

.progress-container {
  display: flex;
  align-items: center;
  width: 100%;
  margin: 5px 0;
}

.time {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
  width: 40px;
  text-align: center;
}

.el-slider {
  flex: 1;
  margin: 0 10px;
}

:deep(.el-slider__runway) {
  background-color: rgba(255, 255, 255, 0.2);
}

:deep(.el-slider__bar) {
  background-color: rgba(255, 255, 255, 0.8);
}

:deep(.el-slider__button) {
  border-color: white;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Page transition animations */
.page-enter-active,
.page-leave-active {
  transition: all 0.4s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(30px);
}
</style> 