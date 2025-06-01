<script setup>
import { ref, computed } from 'vue'
import { useMusicStore } from '@/stores/musicStore'
import { useI18n } from 'vue-i18n'

const musicStore = useMusicStore()
const { t } = useI18n()

// Recently played tracks
const recentTracks = computed(() => {
  // Get unique tracks from history (no duplicates)
  const uniqueTracks = []
  const trackIds = new Set()
  
  for (const entry of musicStore.playHistory) {
    const track = musicStore.musicLibrary.find(t => t.id === entry.trackId)
    if (track && !trackIds.has(track.id)) {
      uniqueTracks.push(track)
      trackIds.add(track.id)
    }
    
    // Show max 10 recent tracks
    if (uniqueTracks.length >= 10) break
  }
  
  return uniqueTracks
})

// Most played tracks
const mostPlayedTracks = computed(() => {
  return [...musicStore.musicLibrary]
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, 10)
})

// Recommended tracks (based on genre)
const recommendedTracks = computed(() => {
  // Group tracks by genre
  const tracksByGenre = {}
  
  musicStore.musicLibrary.forEach(track => {
    if (track.genre && track.genre.length > 0) {
      track.genre.forEach(genre => {
        if (!tracksByGenre[genre]) {
          tracksByGenre[genre] = []
        }
        tracksByGenre[genre].push(track)
      })
    }
  })
  
  // Get tracks from most popular genres
  const recommendations = []
  const genres = Object.keys(tracksByGenre).sort((a, b) => 
    tracksByGenre[b].length - tracksByGenre[a].length
  )
  
  // Get up to 2 tracks from each of the top 3 genres
  for (let i = 0; i < Math.min(3, genres.length); i++) {
    const genreTracks = tracksByGenre[genres[i]]
    recommendations.push(...genreTracks.slice(0, 2))
    
    if (recommendations.length >= 6) break
  }
  
  return recommendations
})

// Albums (grouped by album name)
const albums = computed(() => {
  const albumMap = new Map()
  
  musicStore.musicLibrary.forEach(track => {
    if (track.album) {
      if (!albumMap.has(track.album)) {
        albumMap.set(track.album, {
          name: track.album,
          artist: track.artist,
          tracks: [],
          coverPath: track.coverPath
        })
      }
      
      albumMap.get(track.album).tracks.push(track)
    }
  })
  
  return Array.from(albumMap.values())
    .sort((a, b) => b.tracks.length - a.tracks.length)
    .slice(0, 6)
})

// Play a track
const playTrack = (track) => {
  musicStore.playTrack(track)
}

// Play all tracks from an album
const playAlbum = (album) => {
  if (album.tracks && album.tracks.length > 0) {
    // Create a temporary playlist with these tracks
    musicStore.createPlaylist(`Album: ${album.name}`, album.tracks)
    musicStore.setCurrentPlaylist(`album-${album.name.toLowerCase().replace(/\s+/g, '-')}`)
    musicStore.playTrack(album.tracks[0])
  }
}

// Format duration (seconds to MM:SS)
const formatDuration = (seconds) => {
  if (!seconds) return '0:00'
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Show empty state
const showEmptyState = computed(() => {
  return musicStore.musicLibrary.length === 0
})
</script>

<template>
  <div class="home">
    <!-- Empty state when no music is added -->
    <div v-if="showEmptyState" class="empty-state">
      <el-icon class="empty-icon"><Headset /></el-icon>
      <h2>{{ t('library.noTracks') }}</h2>
      <p>{{ t('library.addToLibrary') }}</p>
      <el-button type="primary" size="large" @click="$emit('add-music')">
        <el-icon><Plus /></el-icon>
        {{ t('library.scanFolder') }}
      </el-button>
    </div>
    
    <template v-else>
      <div class="welcome-banner">
        <div class="welcome-content">
          <h1>{{ t('app.name') }}</h1>
          <p>{{ t('library.title') }}</p>
        </div>
      </div>
      
      <div class="home-content">
        <!-- Recently Played -->
        <div class="section">
          <div class="section-header">
            <h2>{{ t('library.recentlyPlayed') }}</h2>
            <el-button v-if="recentTracks.length > 0" text>{{ t('app.search') }}</el-button>
          </div>
          
          <div v-if="recentTracks.length > 0" class="track-grid">
            <div 
              v-for="track in recentTracks.slice(0, 6)" 
              :key="track.id" 
              class="track-card"
              @click="playTrack(track)"
            >
              <div class="track-image">
                <img :src="track.coverPath ? `file://${track.coverPath}` : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0Ij48cGF0aCBmaWxsPSJub25lIiBkPSJNMCAwaDI0djI0SDB6Ii8+PHBhdGggZD0iTTEyIDIyQzYuNDc3IDIyIDIgMTcuNTIzIDIgMTJTNi40NzcgMiAxMiAyYTkuOTcgOS45NyAwIDAgMSA3LjUwNiAzLjQzNWw0LTQuNDMyVjguMDY3bC00IDQuNDE0QTEwLjAyOCAxMC4wMjggMCAwIDEgMjIgMTJjMCA1LjUyMy00LjQ3NyAxMC0xMCAxMHptMC0yYTggOCAwIDEgMCAwLTE2IDggOCAwIDAgMCAwIDE2em0yLTRoLTVsLS41LS41di01bC41LS41SDEybDItMkg5djhoNmwtMi0yeiIgZmlsbD0iIzYwN2Q4YiIvPjwvc3ZnPgo='" alt="Album art" />
                <div class="play-overlay">
                  <el-icon><VideoPlay /></el-icon>
                </div>
              </div>
              <div class="track-info">
                <div class="track-title">{{ track.title }}</div>
                <div class="track-artist">{{ track.artist }}</div>
              </div>
            </div>
          </div>
          
          <el-empty v-else :description="t('app.noResults')" />
        </div>
        
        <!-- Albums -->
        <div class="section">
          <div class="section-header">
            <h2>{{ t('library.albums') }}</h2>
            <el-button v-if="albums.length > 0" text>{{ t('app.search') }}</el-button>
          </div>
          
          <div v-if="albums.length > 0" class="album-grid">
            <div 
              v-for="album in albums" 
              :key="album.name" 
              class="album-card"
              @click="playAlbum(album)"
            >
              <div class="album-image">
                <img :src="album.coverPath ? `file://${album.coverPath}` : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0Ij48cGF0aCBmaWxsPSJub25lIiBkPSJNMCAwaDI0djI0SDB6Ii8+PHBhdGggZD0iTTEyIDIyQzYuNDc3IDIyIDIgMTcuNTIzIDIgMTJTNi40NzcgMiAxMiAyYTkuOTcgOS45NyAwIDAgMSA3LjUwNiAzLjQzNWw0LTQuNDMyVjguMDY3bC00IDQuNDE0QTEwLjAyOCAxMC4wMjggMCAwIDEgMjIgMTJjMCA1LjUyMy00LjQ3NyAxMC0xMCAxMHptMC0yYTggOCAwIDEgMCAwLTE2IDggOCAwIDAgMCAwIDE2em0yLTRoLTVsLS41LS41di01bC41LS41SDEybDItMkg5djhoNmwtMi0yeiIgZmlsbD0iIzYwN2Q4YiIvPjwvc3ZnPgo='" alt="Album art" />
                <div class="play-overlay">
                  <el-icon><VideoPlay /></el-icon>
                </div>
              </div>
              <div class="album-info">
                <div class="album-title">{{ album.name }}</div>
                <div class="album-artist">{{ album.artist }}</div>
                <div class="album-tracks">{{ album.tracks.length }} {{ t('library.tracks').toLowerCase() }}</div>
              </div>
            </div>
          </div>
          
          <el-empty v-else description="No albums found" />
        </div>
        
        <!-- Recommended -->
        <div class="section" v-if="recommendedTracks.length > 0">
          <div class="section-header">
            <h2>Recommended For You</h2>
            <el-button text>View All</el-button>
          </div>
          
          <div class="track-grid">
            <div 
              v-for="track in recommendedTracks" 
              :key="track.id" 
              class="track-card"
              @click="playTrack(track)"
            >
              <div class="track-image">
                <img :src="track.coverPath ? `file://${track.coverPath}` : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0Ij48cGF0aCBmaWxsPSJub25lIiBkPSJNMCAwaDI0djI0SDB6Ii8+PHBhdGggZD0iTTEyIDIyQzYuNDc3IDIyIDIgMTcuNTIzIDIgMTJTNi40NzcgMiAxMiAyYTkuOTcgOS45NyAwIDAgMSA3LjUwNiAzLjQzNWw0LTQuNDMyVjguMDY3bC00IDQuNDE0QTEwLjAyOCAxMC4wMjggMCAwIDEgMjIgMTJjMCA1LjUyMy00LjQ3NyAxMC0xMCAxMHptMC0yYTggOCAwIDEgMCAwLTE2IDggOCAwIDAgMCAwIDE2em0yLTRoLTVsLS41LS41di01bC41LS41SDEybDItMkg5djhoNmwtMi0yeiIgZmlsbD0iIzYwN2Q4YiIvPjwvc3ZnPgo='" alt="Album art" />
                <div class="play-overlay">
                  <el-icon><VideoPlay /></el-icon>
                </div>
              </div>
              <div class="track-info">
                <div class="track-title">{{ track.title }}</div>
                <div class="track-artist">{{ track.artist }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Most Played -->
        <div class="section" v-if="mostPlayedTracks.length > 0">
          <div class="section-header">
            <h2>Most Played</h2>
            <el-button text>View All</el-button>
          </div>
          
          <div class="track-list">
            <el-table :data="mostPlayedTracks" style="width: 100%" @row-click="playTrack">
              <el-table-column width="50">
                <template #default="scope">
                  <el-button circle size="small" @click.stop="playTrack(scope.row)">
                    <el-icon><VideoPlay /></el-icon>
                  </el-button>
                </template>
              </el-table-column>
              
              <el-table-column label="Title" prop="title" />
              <el-table-column label="Artist" prop="artist" />
              <el-table-column label="Album" prop="album" />
              
              <el-table-column label="Duration" width="100">
                <template #default="scope">
                  {{ formatDuration(scope.row.duration) }}
                </template>
              </el-table-column>
              
              <el-table-column label="Plays" width="80" prop="playCount" />
            </el-table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.home {
  padding: 0;
  width: 100%;
  max-width: 100%;
  height: 100%;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

.home-content {
  flex: 1;
  width: 100%;
  padding: 0 20px 20px;
}

.welcome-banner {
  background: linear-gradient(135deg, var(--app-primary-color), #8f00ff);
  color: white;
  padding: 40px 20px;
  margin: 0;
  border-radius: 0;
  width: 100%;
}

.welcome-content {
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

.welcome-content h1 {
  font-size: 28px;
  margin-bottom: 10px;
  color: white;
}

.welcome-content p {
  font-size: 16px;
  opacity: 0.9;
}

.section {
  margin-bottom: 40px;
  width: 100%;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  width: 100%;
}

h2 {
  font-size: 18px;
  margin: 0;
  color: var(--app-text-color);
}

.track-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 20px;
  width: 100%;
}

.album-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
  width: 100%;
}

.track-card, .album-card {
  cursor: pointer;
  transition: transform 0.2s;
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--app-sidebar-color);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.track-card:hover, .album-card:hover {
  transform: translateY(-5px);
}

.track-image, .album-image {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  flex-shrink: 0;
}

.track-image img, .album-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.play-overlay .el-icon {
  font-size: 40px;
  color: white;
}

.track-card:hover .play-overlay,
.album-card:hover .play-overlay {
  opacity: 1;
}

.track-info, .album-info {
  padding: 12px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.track-title, .album-title {
  font-weight: bold;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-artist, .album-artist {
  font-size: 0.85rem;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.album-tracks {
  font-size: 0.8rem;
  color: var(--el-text-color-secondary);
  margin-top: 5px;
}

.track-list {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  text-align: center;
  height: 100%;
  width: 100%;
}

.empty-icon {
  font-size: 64px;
  color: var(--app-primary-color);
  margin-bottom: 20px;
}

.empty-state h2 {
  font-size: 24px;
  margin-bottom: 10px;
}

.empty-state p {
  font-size: 16px;
  color: var(--el-text-color-secondary);
  margin-bottom: 20px;
}

/* 响应式布局 */
@media (max-width: 1400px) {
  .track-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  
  .album-grid {
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  }
}

@media (max-width: 1200px) {
  .track-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
  
  .album-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
}

@media (max-width: 992px) {
  .track-grid {
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  }
  
  .album-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}

@media (max-width: 768px) {
  .track-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 15px;
  }
  
  .album-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 15px;
  }
  
  .welcome-banner {
    padding: 30px 15px;
  }
  
  .welcome-content h1 {
    font-size: 24px;
  }
  
  .home-content {
    padding: 0 15px 15px;
  }
}

@media (max-width: 576px) {
  .track-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 10px;
  }
  
  .album-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 10px;
  }
  
  .welcome-banner {
    padding: 20px 10px;
  }
  
  .welcome-content h1 {
    font-size: 20px;
  }
  
  .section {
    margin-bottom: 30px;
  }
  
  .home-content {
    padding: 0 10px 10px;
  }
}
</style>
