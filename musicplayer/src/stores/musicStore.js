import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
// 不直接导入Node.js模块
// import * as mm from 'music-metadata'
// import path from 'path'
// import fs from 'fs'

export const useMusicStore = defineStore('music', () => {
  // State
  const musicLibrary = ref([])
  const currentTrack = ref(null)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const volume = ref(0.7)
  const isMuted = ref(false)
  const previousVolume = ref(0.7)
  const playbackMode = ref('sequential') // 'sequential', 'repeat-one', 'shuffle'
  const playlists = ref([
    { id: 'favorites', name: 'Favorites', tracks: [] }
  ])
  const currentPlaylist = ref(null)
  const audioElement = ref(null)
  const playHistory = ref([])
  const scanDirectories = ref([])
  const isScanning = ref(false)
  
  // Computed
  const currentTrackIndex = computed(() => {
    if (!currentTrack.value || !currentPlaylist.value) return -1
    return currentPlaylist.value.tracks.findIndex(track => track.id === currentTrack.value.id)
  })
  
  const duration = computed(() => {
    // 首先使用audioElement的duration
    const audioDuration = audioElement.value ? audioElement.value.duration : 0
    
    // 如果audioDuration是有效值，返回它
    if (typeof audioDuration === 'number' && isFinite(audioDuration) && audioDuration > 0) {
      // 如果当前播放的曲目持续时间与音频元素持续时间不同，更新曲目
      if (currentTrack.value && 
          typeof currentTrack.value.duration === 'number' && 
          Math.abs(currentTrack.value.duration - audioDuration) > 1) {
        // 持续时间相差超过1秒，更新曲目的持续时间
        currentTrack.value.duration = audioDuration
        console.log('更新当前曲目的持续时间:', audioDuration)
      }
      return audioDuration
    }
    
    // 如果audioDuration无效，但currentTrack有持续时间，返回它
    if (currentTrack.value && 
        typeof currentTrack.value.duration === 'number' && 
        isFinite(currentTrack.value.duration) && 
        currentTrack.value.duration > 0) {
      return currentTrack.value.duration
    }
    
    // 如果都无效，返回0
    return 0
  })
  
  // Actions
  function initAudio() {
    try {
      if (!audioElement.value) {
        console.log('创建新的音频元素')
        audioElement.value = new Audio()
        
        // 设置音量
        audioElement.value.volume = volume.value
        
        // 添加基本事件监听器
        audioElement.value.addEventListener('ended', () => {
          console.log('音频播放结束')
          if (playbackMode.value === 'repeat-one') {
            audioElement.value.currentTime = 0
            const playPromise = audioElement.value.play()
            if (playPromise !== undefined) {
              playPromise.catch(error => {
                console.error('重复播放失败:', error)
              })
            }
          } else {
            playNext()
          }
        })
        
        // 监听加载错误
        audioElement.value.addEventListener('error', (e) => {
          console.error('Audio error:', e)
          console.error('Audio error code:', audioElement.value.error ? audioElement.value.error.code : 'unknown')
          console.error('Audio source:', audioElement.value.src)
          isPlaying.value = false
        })
        
        // 监听加载过程
        audioElement.value.addEventListener('loadedmetadata', () => {
          console.log('Audio metadata loaded, duration:', audioElement.value.duration)
        })
        
        // 监听播放和暂停事件
        audioElement.value.addEventListener('play', () => {
          isPlaying.value = true
          console.log('Audio play event fired from init')
        })
        
        audioElement.value.addEventListener('pause', () => {
          isPlaying.value = false
          console.log('Audio pause event fired from init')
        })
      } else {
        console.log('重置现有音频元素')
        // 如果音频元素已存在，创建一个新的实例
        const oldElement = audioElement.value
        
        // 暂停并移除旧元素的源
        try {
          oldElement.pause()
          oldElement.removeAttribute('src')
          oldElement.load()
        } catch (e) {
          console.warn('清理旧音频元素时出错:', e)
        }
        
        // 创建新的音频元素
        const newElement = new Audio()
        
        // 复制音量设置
        newElement.volume = volume.value
        
        // 添加必要的事件监听器
        newElement.addEventListener('ended', () => {
          console.log('音频播放结束')
          if (playbackMode.value === 'repeat-one') {
            newElement.currentTime = 0
            const playPromise = newElement.play()
            if (playPromise !== undefined) {
              playPromise.catch(error => {
                console.error('重复播放失败:', error)
              })
            }
          } else {
            playNext()
          }
        })
        
        newElement.addEventListener('error', (e) => {
          console.error('Audio error:', e)
          console.error('Audio error code:', newElement.error ? newElement.error.code : 'unknown')
          console.error('Audio source:', newElement.src)
          isPlaying.value = false
        })
        
        newElement.addEventListener('loadedmetadata', () => {
          console.log('Audio metadata loaded, duration:', newElement.duration)
        })
        
        // 监听播放和暂停事件
        newElement.addEventListener('play', () => {
          isPlaying.value = true
          console.log('Audio play event fired from init')
        })
        
        newElement.addEventListener('pause', () => {
          isPlaying.value = false
          console.log('Audio pause event fired from init')
        })
        
        // 替换旧的音频元素
        audioElement.value = newElement
      }
    } catch (error) {
      console.error('初始化音频元素时出错:', error)
    }
  }
  
  // 扫描文件夹函数 - 通过Electron IPC调用
  async function scanFolder(folderPath, isSingleFile = false) {
    if (!folderPath || isScanning.value) return { success: false, message: "Scanning already in progress" }
    
    console.log("开始扫描:", folderPath, isSingleFile ? "（单个文件）" : "（文件夹）")
    isScanning.value = true
    
    // 检查是否在Electron环境中
    if (!window.electronAPI) {
      console.error("无法扫描音乐文件 - 这个功能需要Electron环境")
      isScanning.value = false
      return { success: false, message: "无法扫描音乐文件 - 这个功能需要Electron环境" }
    }
    
    try {
      // 通过IPC调用主进程来处理文件系统操作
      // 这里我们需要实现一个新的IPC方法来处理扫描
      const result = await window.electronAPI.scanMusicFolder(folderPath, isSingleFile)
      
      // 如果扫描成功，将轨道添加到库中
      if (result && result.success && result.tracks) {
        // 添加新的轨道到库中
        for (const track of result.tracks) {
          // 检查是否已存在
          const existingTrack = musicLibrary.value.find(t => t.path === track.path)
          if (existingTrack) continue
          
          // 添加到库中
          musicLibrary.value.push(track)
        }
        
        // 如果没有活动的播放列表，创建"Library"播放列表
        if (!currentPlaylist.value && musicLibrary.value.length > 0) {
          createPlaylist('Library', [...musicLibrary.value])
          setCurrentPlaylist('library')
        }
        
        // 如果是文件夹，添加到扫描目录列表中
        if (!isSingleFile && !scanDirectories.value.includes(folderPath)) {
          scanDirectories.value.push(folderPath)
        }
      }
      
      isScanning.value = false
      return result
    } catch (error) {
      console.error('Error scanning:', error)
      isScanning.value = false
      return { 
        success: false, 
        trackCount: 0, 
        message: `Error: ${error.message}` 
      }
    }
  }
  
  function playTrack(track) {
    if (!track) return
    
    console.log('开始播放:', track.title, track.artist)
    
    // 确保在播放新歌曲前停止当前播放的歌曲
    if (audioElement.value) {
      try {
        // 停止当前播放的音频
        audioElement.value.pause()
        audioElement.value.currentTime = 0
        
        // 移除所有事件监听器
        const oldAudio = audioElement.value
        const events = ['loadedmetadata', 'canplay', 'timeupdate', 'error', 'ended', 'play', 'pause']
        events.forEach(event => {
          const clonedOldAudio = oldAudio
          if (clonedOldAudio) {
            try {
              // 使用空函数移除所有事件监听器
              clonedOldAudio.removeEventListener(event, () => {})
            } catch (err) {
              console.warn(`移除事件监听器 ${event} 时出错:`, err)
            }
          }
        })
      } catch (error) {
        console.error('停止当前音频时出错:', error)
      }
    }
    
    // 初始化新的音频元素
    initAudio()
    
    // 设置当前曲目
    currentTrack.value = track
    
    // 根据环境处理路径
    let audioSrc = track.path
    
    const playAudio = async () => {
      try {
        if (window.electronAPI) {
          // 通过主进程获取正确的文件URL
          const fileUrl = await window.electronAPI.getFileUrl(track.path)
          if (fileUrl) {
            audioSrc = fileUrl
          } else {
            console.error('无法获取有效的文件URL，可能文件不存在或无法访问', track.path)
            alert(`无法播放文件: ${track.title}\n文件可能不存在或无法访问。`)
            return
          }
        } else {
          // 如果无法获取URL，使用默认处理方式
          if (audioSrc.includes('\\')) {
            audioSrc = `file:///${audioSrc.replace(/\\/g, '/')}`
          } else {
            audioSrc = `file://${audioSrc}`
          }
          audioSrc = audioSrc.replace(/([^:])\/\//g, '$1/')
        }
        
        console.log('Playing audio from:', audioSrc)
        
        // 尝试使用Fetch API和Blob URL来绕过一些限制
        try {
          // 只在file://协议时使用此方法
          if (audioSrc.startsWith('file://')) {
            console.log('尝试使用Blob URL播放文件')
            
            // 请求主进程获取文件数据
            const arrayBuffer = await window.electronAPI.getFileData(track.path)
            if (arrayBuffer) {
              // 创建一个Blob
              const blob = new Blob([arrayBuffer], { type: getMimeType(track.path) })
              
              // 创建Blob URL
              const blobUrl = URL.createObjectURL(blob)
              console.log('创建的Blob URL:', blobUrl)
              
              // 使用Blob URL代替file://
              audioSrc = blobUrl
              
              // 在播放完成后释放Blob URL
              audioElement.value.onended = () => {
                URL.revokeObjectURL(blobUrl)
              }
            }
          }
        } catch (blobError) {
          console.error('创建Blob URL失败:', blobError)
          // 继续使用原始URL
        }
        
        // 重置音频元素
        if (audioElement.value) {
          // 移除所有事件监听器
          audioElement.value.pause()
          audioElement.value.removeAttribute('src')
          audioElement.value.load()
        } else {
          // 如果不存在就创建
          initAudio()
        }
        
        // 设置一个超时，以防文件加载太久
        let loadTimeout = setTimeout(() => {
          console.error('音频加载超时')
          alert(`加载音频文件超时: ${track.title}`)
        }, 10000)
        
        // 监听元数据加载事件
        const onLoadedMetadata = () => {
          console.log('音频元数据已加载, 持续时间:', audioElement.value.duration)
          // 手动触发currentTime的更新，确保界面更新
          currentTime.value = audioElement.value.currentTime
          
          // 清除超时
          clearTimeout(loadTimeout)
        }
        
        // 监听一次性事件
        const onCanPlay = () => {
          clearTimeout(loadTimeout)
          console.log('Audio can now be played, duration:', audioElement.value.duration)
          
          // 如果音频的duration是NaN或Infinity，尝试从track的duration使用
          if (isNaN(audioElement.value.duration) || !isFinite(audioElement.value.duration)) {
            console.log('使用track.duration:', track.duration)
            // 创建一个自定义的duration getter
            Object.defineProperty(audioElement.value, 'duration', {
              get: function() {
                return track.duration || 0;
              }
            });
          }
        }
        
        const onTimeUpdate = () => {
          // 更新当前时间
          currentTime.value = audioElement.value.currentTime
        }
        
        const onError = (e) => {
          clearTimeout(loadTimeout)
          console.error('Audio load error:', e)
          
          // 尝试使用系统默认播放器播放
          if (window.electronAPI && confirm(`无法在应用内播放文件: ${track.title}\n是否使用系统默认播放器打开?`)) {
            window.electronAPI.openFile(track.path)
              .then(success => {
                if (!success) {
                  alert('打开文件失败')
                }
              })
              .catch(err => {
                console.error('打开文件出错:', err)
                alert('打开文件出错: ' + err.message)
              })
          }
        }
        
        // 添加播放和暂停事件监听器
        const onPlay = () => {
          isPlaying.value = true
          console.log('Audio play event fired')
        }
        
        const onPause = () => {
          isPlaying.value = false
          console.log('Audio pause event fired')
        }
        
        // 添加事件监听器
        audioElement.value.addEventListener('loadedmetadata', onLoadedMetadata)
        audioElement.value.addEventListener('canplay', onCanPlay)
        audioElement.value.addEventListener('timeupdate', onTimeUpdate)
        audioElement.value.addEventListener('error', onError)
        audioElement.value.addEventListener('play', onPlay)
        audioElement.value.addEventListener('pause', onPause)
        
        // 设置音频源
        audioElement.value.src = audioSrc
        
        // 播放音频
        const playPromise = audioElement.value.play()
        
        if (playPromise !== undefined) {
          playPromise.then(() => {
            isPlaying.value = true
            
            // Update play count and last played time
            track.playCount += 1
            track.lastPlayed = new Date()
            
            // Add to play history
            const historyEntry = {
              trackId: track.id,
              playedAt: new Date()
            }
            playHistory.value.unshift(historyEntry)
            
            // Limit history to last 100 entries
            if (playHistory.value.length > 100) {
              playHistory.value = playHistory.value.slice(0, 100)
            }
            
            // 再次检查duration是否可用
            console.log('播放开始后的duration:', audioElement.value.duration)
            if (isNaN(audioElement.value.duration) || !isFinite(audioElement.value.duration)) {
              // 如果仍然无效，但track有持续时间，使用track的持续时间
              if (track.duration && isFinite(track.duration)) {
                console.log('使用track.duration:', track.duration)
              }
            }
          }).catch(error => {
            console.error('Failed to play track:', error)
            console.error('Audio source was:', audioSrc)
            console.error('Track path was:', track.path)
            
            // 重置播放状态
            isPlaying.value = false
            
            // 尝试使用系统默认播放器播放
            if (window.electronAPI && confirm(`无法在应用内播放: ${track.title}\n错误: ${error.message}\n\n是否使用系统默认播放器打开?`)) {
              window.electronAPI.openFile(track.path)
                .then(success => {
                  if (!success) {
                    alert('打开文件失败')
                  }
                })
                .catch(err => {
                  console.error('打开文件出错:', err)
                  alert('打开文件出错: ' + err.message)
                })
            }
          })
        } else {
          // 对于不返回Promise的旧版浏览器，直接设置播放状态
          isPlaying.value = true
        }
      } catch (error) {
        console.error('Error setting up audio playback:', error)
        alert(`设置音频播放时出错: ${error.message}`)
        isPlaying.value = false
      }
    }
    
    // 执行播放
    playAudio()
  }
  
  function togglePlayPause() {
    if (!audioElement.value || !currentTrack.value) return
    
    if (isPlaying.value) {
      audioElement.value.pause()
      isPlaying.value = false
    } else {
      const playPromise = audioElement.value.play()
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('播放失败:', error)
          isPlaying.value = false
        })
      }
    }
  }
  
  // 明确的播放函数，用于确保音频播放
  function play() {
    if (!audioElement.value || !currentTrack.value) return false
    
    console.log('尝试明确播放音频')
    try {
      const playPromise = audioElement.value.play()
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('明确播放成功')
          isPlaying.value = true
          return true
        }).catch(error => {
          console.error('明确播放失败:', error)
          isPlaying.value = false
          return false
        })
      }
      
      return isPlaying.value
    } catch (error) {
      console.error('播放时发生异常:', error)
      return false
    }
  }
  
  function playNext() {
    if (!currentPlaylist.value || !currentTrack.value) return
    
    const currentIndex = currentTrackIndex.value
    if (currentIndex === -1) return
    
    let nextIndex = -1
    
    if (playbackMode.value === 'shuffle') {
      // Play a random track that's not the current one
      const availableIndices = Array.from(
        { length: currentPlaylist.value.tracks.length }, 
        (_, i) => i
      ).filter(i => i !== currentIndex)
      
      if (availableIndices.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableIndices.length)
        nextIndex = availableIndices[randomIndex]
      }
    } else {
      // Sequential playback - go to next track or wrap around
      nextIndex = (currentIndex + 1) % currentPlaylist.value.tracks.length
    }
    
    if (nextIndex !== -1) {
      playTrack(currentPlaylist.value.tracks[nextIndex])
    }
  }
  
  function playPrevious() {
    if (!currentPlaylist.value || !currentTrack.value) return
    
    const currentIndex = currentTrackIndex.value
    if (currentIndex === -1) return
    
    // If we're more than 3 seconds into the song, restart it instead of going to previous
    if (audioElement.value && audioElement.value.currentTime > 3) {
      audioElement.value.currentTime = 0
      return
    }
    
    let prevIndex = -1
    
    if (playbackMode.value === 'shuffle') {
      // Play a random track that's not the current one
      const availableIndices = Array.from(
        { length: currentPlaylist.value.tracks.length }, 
        (_, i) => i
      ).filter(i => i !== currentIndex)
      
      if (availableIndices.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableIndices.length)
        prevIndex = availableIndices[randomIndex]
      }
    } else {
      // Go to previous track or wrap around to the last
      prevIndex = currentIndex > 0 
        ? currentIndex - 1 
        : currentPlaylist.value.tracks.length - 1
    }
    
    if (prevIndex !== -1) {
      playTrack(currentPlaylist.value.tracks[prevIndex])
    }
  }
  
  function setVolume(newVolume) {
    if (newVolume < 0) newVolume = 0
    if (newVolume > 1) newVolume = 1
    
    volume.value = newVolume
    if (audioElement.value) {
      audioElement.value.volume = newVolume
    }
    
    if (newVolume > 0) {
      isMuted.value = false
    }
  }
  
  function toggleMute() {
    if (isMuted.value) {
      // Unmute
      isMuted.value = false
      volume.value = previousVolume.value
      if (audioElement.value) {
        audioElement.value.volume = volume.value
      }
    } else {
      // Mute
      isMuted.value = true
      previousVolume.value = volume.value
      volume.value = 0
      if (audioElement.value) {
        audioElement.value.volume = 0
      }
    }
  }
  
  function seek(time) {
    if (!audioElement.value) return
    
    // 检查时间是否是有效的数字
    if (typeof time !== 'number' || !isFinite(time)) {
      console.error('Attempted to seek to invalid time:', time)
      return
    }
    
    if (time < 0) time = 0
    
    // 检查duration是否可用且有效
    const audioDuration = audioElement.value.duration
    if (isNaN(audioDuration) || !isFinite(audioDuration)) {
      console.error('Audio duration is not valid:', audioDuration)
      return
    }
    
    if (time > audioDuration) time = audioDuration
    
    try {
      // 设置音频元素的当前时间
      audioElement.value.currentTime = time
      // 立即更新currentTime值，不等待timeupdate事件
      currentTime.value = time
      
      // 触发自定义事件，通知组件时间已改变
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('music-time-changed', { 
          detail: { time: time } 
        }))
      }
      
      console.log('Seek to time:', time)
    } catch (error) {
      console.error('Error setting currentTime:', error)
    }
  }
  
  function setPlaybackMode(mode) {
    if (['sequential', 'repeat-one', 'shuffle'].includes(mode)) {
      playbackMode.value = mode
    }
  }
  
  function createPlaylist(name, tracks = []) {
    const id = name.toLowerCase().replace(/\s+/g, '-')
    
    // Don't create duplicate playlists
    if (playlists.value.some(p => p.id === id)) {
      return
    }
    
    playlists.value.push({
      id,
      name,
      tracks: [...tracks],
      createdAt: new Date()
    })
  }
  
  function deletePlaylist(playlistId) {
    const index = playlists.value.findIndex(p => p.id === playlistId)
    if (index !== -1 && playlistId !== 'favorites') {
      playlists.value.splice(index, 1)
      
      // If we deleted the current playlist, switch to the library
      if (currentPlaylist.value && currentPlaylist.value.id === playlistId) {
        setCurrentPlaylist('library')
      }
    }
  }
  
  function addToPlaylist(playlistId, track) {
    const playlist = playlists.value.find(p => p.id === playlistId)
    if (playlist) {
      // Don't add duplicates
      if (!playlist.tracks.some(t => t.id === track.id)) {
        playlist.tracks.push(track)
      }
    }
  }
  
  function removeFromPlaylist(playlistId, trackId) {
    const playlist = playlists.value.find(p => p.id === playlistId)
    if (playlist) {
      const index = playlist.tracks.findIndex(t => t.id === trackId)
      if (index !== -1) {
        playlist.tracks.splice(index, 1)
      }
    }
  }
  
  function toggleFavorite(track) {
    const favorites = playlists.value.find(p => p.id === 'favorites')
    if (!favorites) return
    
    const isFavorite = favorites.tracks.some(t => t.id === track.id)
    
    if (isFavorite) {
      removeFromPlaylist('favorites', track.id)
    } else {
      addToPlaylist('favorites', track)
    }
  }
  
  function isFavorite(track) {
    const favorites = playlists.value.find(p => p.id === 'favorites')
    if (!favorites) return false
    
    return favorites.tracks.some(t => t.id === track.id)
  }
  
  function setCurrentPlaylist(playlistId) {
    const playlist = playlists.value.find(p => p.id === playlistId)
    if (playlist) {
      currentPlaylist.value = playlist
    }
  }
  
  async function loadLyrics(track) {
    if (!window.electronAPI) {
      console.error('无法加载歌词: electronAPI 不可用')
      return null
    }
    
    console.log('开始加载歌词，曲目信息:', {
      title: track.title,
      artist: track.artist,
      path: track.path,
      lyricsPath: track.lyricsPath || '未指定'
    })
    
    // 如果track已经有lyricsPath并且存在，直接使用
    if (track.lyricsPath) {
      try {
        console.log('尝试从预设路径加载歌词:', track.lyricsPath)
        const lyricsText = await window.electronAPI.readLyricsFile(track.lyricsPath)
        if (lyricsText) {
          console.log('从预设路径成功加载歌词, 长度:', lyricsText.length)
          return parseLyrics(lyricsText)
        } else {
          console.warn('从预设路径加载歌词失败: 歌词文件为空或不存在')
        }
      } catch (error) {
        console.error('从预设路径加载歌词失败:', error)
        // 失败后继续尝试其他路径
      }
    } else {
      console.log('曲目没有预设的歌词路径，将尝试查找匹配的歌词文件')
    }
    
    // 如果没有预设路径或者加载失败，尝试多种可能的路径
    try {
      // 获取音频文件的路径信息
      const filePath = track.path
      if (!filePath) {
        console.error('无法加载歌词: 曲目路径为空')
        return null
      }
      
      // 尝试同名.lrc文件
      const lyricsPath1 = filePath.replace(/\.[^/.]+$/, '.lrc')
      
      // 尝试"歌手 - 歌名.lrc"格式
      const fileName = filePath.split(/[\\/]/).pop()
      const dirPath = filePath.substring(0, filePath.length - fileName.length)
      const artistTitle = `${track.artist} - ${track.title}.lrc`
      const lyricsPath2 = `${dirPath}${artistTitle}`
      
      // 尝试"歌名.lrc"格式
      const titleOnly = `${track.title}.lrc`
      const lyricsPath3 = `${dirPath}${titleOnly}`
      
      console.log('尝试查找歌词文件:')
      console.log('- 路径1 (同名):', lyricsPath1)
      console.log('- 路径2 (艺术家-标题):', lyricsPath2)
      console.log('- 路径3 (仅标题):', lyricsPath3)
      
      // 按顺序尝试读取歌词文件
      const paths = [lyricsPath1, lyricsPath2, lyricsPath3]
      
      for (const path of paths) {
        try {
          console.log('尝试读取歌词:', path)
          const lyricsText = await window.electronAPI.readLyricsFile(path)
          if (lyricsText) {
            console.log('成功加载歌词, 长度:', lyricsText.length, '路径:', path)
            // 更新track的lyricsPath，以便下次直接使用
            track.lyricsPath = path
            const parsedLyrics = parseLyrics(lyricsText)
            console.log('解析后歌词行数:', parsedLyrics.length)
            return parsedLyrics
          } else {
            console.log(`路径 ${path} 未找到歌词或歌词为空`)
          }
        } catch (err) {
          console.log(`路径 ${path} 读取失败:`, err.message)
        }
      }
      
      console.log('所有路径都未找到歌词文件')
      return null
    } catch (error) {
      console.error('查找歌词文件出错:', error)
      return null
    }
  }
  
  function parseLyrics(lyricsText) {
    if (!lyricsText) {
      console.error('歌词文本为空，无法解析')
      return []
    }
    
    console.log('开始解析歌词，原始文本长度:', lyricsText.length)
    
    const lines = lyricsText.split('\n')
    console.log('歌词行数:', lines.length)
    
    const lyricItems = []
    
    // Regular expression to match LRC format: [mm:ss.xx] lyrics
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2})\]/g
    
    for (const line of lines) {
      if (!line.trim()) continue
      
      let match
      let lastIndex = 0
      let lyricText = line
      
      // 重置正则表达式的lastIndex
      timeRegex.lastIndex = 0
      
      while ((match = timeRegex.exec(line)) !== null) {
        lastIndex = timeRegex.lastIndex
        
        const minutes = parseInt(match[1])
        const seconds = parseInt(match[2])
        const hundredths = parseInt(match[3])
        
        const time = minutes * 60 + seconds + hundredths / 100
        
        lyricText = line.substring(lastIndex).trim()
        
        lyricItems.push({
          time,
          text: lyricText
        })
      }
    }
    
    if (lyricItems.length === 0) {
      console.warn('没有找到符合LRC格式的歌词行')
      
      // 如果没有匹配的时间标签，尝试将每行作为普通文本添加
      if (lines.length > 0) {
        console.log('将文本作为普通歌词处理，每5秒显示一行')
        lines.forEach((line, index) => {
          if (line.trim()) {
            lyricItems.push({
              time: index * 5, // 每5秒显示一行
              text: line.trim()
            })
          }
        })
      }
    }
    
    // Sort by time
    const sortedLyrics = lyricItems.sort((a, b) => a.time - b.time)
    console.log('解析完成，有效歌词行数:', sortedLyrics.length)
    return sortedLyrics
  }
  
  function searchLibrary(query) {
    if (!query) return musicLibrary.value
    
    const searchTerm = query.toLowerCase()
    return musicLibrary.value.filter(track => 
      track.title.toLowerCase().includes(searchTerm) ||
      track.artist.toLowerCase().includes(searchTerm) ||
      track.album.toLowerCase().includes(searchTerm) ||
      (track.genre && track.genre.some(g => g.toLowerCase().includes(searchTerm)))
    )
  }
  
  function sortLibrary(field, direction = 'asc') {
    return [...musicLibrary.value].sort((a, b) => {
      let valueA = a[field]
      let valueB = b[field]
      
      // Handle special cases
      if (field === 'dateAdded' || field === 'lastPlayed') {
        valueA = valueA ? new Date(valueA).getTime() : 0
        valueB = valueB ? new Date(valueB).getTime() : 0
      } else if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase()
        valueB = valueB.toLowerCase()
      }
      
      if (valueA === valueB) return 0
      if (valueA > valueB) return direction === 'asc' ? 1 : -1
      return direction === 'asc' ? -1 : 1
    })
  }
  
  // 根据文件扩展名获取MIME类型
  function getMimeType(filePath) {
    const ext = filePath.toLowerCase().split('.').pop()
    const mimeTypes = {
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'flac': 'audio/flac',
      'ogg': 'audio/ogg',
      'm4a': 'audio/mp4',
      'aac': 'audio/aac'
    }
    return mimeTypes[ext] || 'audio/mpeg'  // 默认返回audio/mpeg
  }
  
  return {
    // State
    musicLibrary,
    currentTrack,
    isPlaying,
    currentTime,
    volume,
    isMuted,
    playbackMode,
    playlists,
    currentPlaylist,
    playHistory,
    scanDirectories,
    isScanning,
    
    // Computed
    currentTrackIndex,
    duration,
    
    // Actions
    initAudio,
    scanFolder,
    playTrack,
    togglePlayPause,
    play,
    playNext,
    playPrevious,
    setVolume,
    toggleMute,
    seek,
    setPlaybackMode,
    createPlaylist,
    deletePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    toggleFavorite,
    isFavorite,
    setCurrentPlaylist,
    loadLyrics,
    searchLibrary,
    sortLibrary
  }
}) 