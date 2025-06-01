<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'

const settingsStore = useSettingsStore()

// Lyrics data
const title = ref('')
const artist = ref('')
const lyrics = ref([])
const currentLyricIndex = ref(-1)
const currentTime = ref(0)

// Handle lyrics data from main process
onMounted(() => {
  console.log('歌词浮动窗口已挂载')
  
  // 重置状态
  title.value = ''
  artist.value = ''
  lyrics.value = []
  currentLyricIndex.value = -1
  currentTime.value = 0
  
  // 监听自定义事件（从preload.js发送的）
  const handleLyricsUpdated = (event) => {
    const data = event.detail
    console.log('歌词浮动窗口收到自定义事件歌词数据:', 
      data?.title || '无标题', 
      data?.artist || '未知艺术家',
      data?.lyrics?.length || 0, '条'
    )
    
    updateLyrics(data)
  }
  
  // 通用的更新歌词函数
  const updateLyrics = (data) => {
    if (!data) return
    
    title.value = data.title || ''
    artist.value = data.artist || ''
    
    if (data.lyrics && Array.isArray(data.lyrics)) {
      lyrics.value = data.lyrics
      console.log('歌词已更新，行数:', lyrics.value.length)
    } else {
      lyrics.value = []
      console.log('歌词数据为空或无效')
    }
    
    // 重置状态
    currentLyricIndex.value = -1
    currentTime.value = 0
  }
  
  window.addEventListener('lyrics-updated', handleLyricsUpdated)
  
  // 通过IPC接口获取歌词数据
  if (window.electronAPI) {
    console.log('设置IPC歌词数据监听器')
    window.electronAPI.onLyricsData((data) => {
      console.log('通过IPC接收到歌词数据:', 
        data?.title || '无标题', 
        data?.artist || '未知艺术家',
        data?.lyrics?.length || 0, '条'
      )
      
      updateLyrics(data)
    })
  } else {
    console.warn('electronAPI不可用，无法接收歌词数据')
  }
  
  // 清理事件监听器
  onUnmounted(() => {
    console.log('歌词浮动窗口卸载，清理监听器')
    window.removeEventListener('lyrics-updated', handleLyricsUpdated)
    if (window.electronAPI && window.electronAPI.removeAllListeners) {
      window.electronAPI.removeAllListeners('lyrics-data')
    }
  })
  
  // 启动计时器模拟时间更新（我们无法直接访问音频元素）
  const timer = setInterval(() => {
    if (lyrics.value && lyrics.value.length > 0) {
      currentTime.value += 0.1
      updateCurrentLyric()
    }
  }, 100)
  
  onUnmounted(() => {
    clearInterval(timer)
  })
})

// 根据时间更新当前歌词
const updateCurrentLyric = () => {
  if (!lyrics.value || lyrics.value.length === 0) return
  
  let index = -1
  
  // 找到当前时间对应的歌词
  for (let i = 0; i < lyrics.value.length; i++) {
    if (lyrics.value[i].time <= currentTime.value) {
      index = i
    } else {
      break
    }
  }
  
  // 只有当索引变化时才更新
  if (index !== currentLyricIndex.value) {
    currentLyricIndex.value = index
    
    // 自动滚动到当前歌词
    if (index !== -1) {
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
  }
}
</script>

<template>
  <div 
    class="lyrics-floating"
    :style="{
      opacity: settingsStore.floatingLyricsOpacity || 0.8
    }"
  >
    <div class="track-info">
      <div class="track-title">{{ title || '无歌曲信息' }}</div>
      <div class="track-artist">{{ artist || '' }}</div>
    </div>
    
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
        未找到歌词
      </div>
    </div>
  </div>
</template>

<style>
body {
  background-color: transparent !important;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

.lyrics-floating {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  overflow: hidden;
  -webkit-app-region: drag; /* 使窗口可拖动 */
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

.track-info {
  padding: 15px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  background-color: rgba(0, 0, 0, 0.3);
}

.track-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 5px;
}

.track-artist {
  font-size: 14px;
  opacity: 0.8;
}

.lyrics-container {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 30vh; /* 让歌词开始显示在容器的三分之一处 */
  padding-bottom: 30vh; /* 在底部也留出空间 */
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
  font-size: 14px;
  margin: 4px 0;
}

.lyric-line.past {
  opacity: 0.4;
  font-size: 12px;
}

.lyric-line.current {
  opacity: 1;
  font-size: 18px;
  font-weight: bold;
  color: #409EFF;
  text-shadow: 0 0 10px rgba(64, 158, 255, 0.5);
}

.lyric-line.future {
  opacity: 0.5;
  font-size: 13px;
}

.no-lyrics {
  text-align: center;
  opacity: 0.6;
  font-style: italic;
  font-size: 16px;
  margin-top: 30vh;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

::-webkit-scrollbar-track {
  background-color: transparent;
}
</style> 