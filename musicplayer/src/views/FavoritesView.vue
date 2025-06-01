<script setup>
import { computed, onMounted } from 'vue'
import { useMusicStore } from '@/stores/musicStore'

const musicStore = useMusicStore()

// Get the favorites playlist
const favoritesPlaylist = computed(() => {
  return musicStore.playlists.find(p => p.id === 'favorites') || { tracks: [] }
})

// Set as current playlist when opening
onMounted(() => {
  musicStore.setCurrentPlaylist('favorites')
})

// Play all tracks
const playAll = () => {
  if (favoritesPlaylist.value.tracks.length > 0) {
    musicStore.playTrack(favoritesPlaylist.value.tracks[0])
  }
}

// Play a track
const playTrack = (track) => {
  musicStore.playTrack(track)
}

// Remove from favorites
const removeFromFavorites = (track) => {
  musicStore.toggleFavorite(track)
}

// Format duration (seconds to MM:SS)
const formatDuration = (seconds) => {
  if (!seconds) return '0:00'
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Calculate total duration
const totalDuration = computed(() => {
  return favoritesPlaylist.value.tracks.reduce((total, track) => {
    return total + (track.duration || 0)
  }, 0)
})

// Format total duration
const formatTotalDuration = computed(() => {
  const totalSeconds = totalDuration.value
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours} hr ${minutes} min`
  }
  
  return `${minutes} min`
})
</script>

<template>
  <div class="favorites">
    <div class="favorites-header">
      <div class="favorites-info">
        <div class="favorites-cover">
          <el-icon><StarFilled /></el-icon>
        </div>
        
        <div>
          <h1>Favorites</h1>
          <div class="favorites-stats">
            {{ favoritesPlaylist.tracks.length }} songs · {{ formatTotalDuration }}
          </div>
        </div>
      </div>
      
      <div class="favorites-actions">
        <el-button 
          type="primary" 
          @click="playAll"
          :disabled="favoritesPlaylist.tracks.length === 0"
        >
          <el-icon><VideoPlay /></el-icon>
          Play All
        </el-button>
      </div>
    </div>
    
    <div v-if="favoritesPlaylist.tracks.length > 0" class="tracks-list">
      <el-table :data="favoritesPlaylist.tracks" style="width: 100%" @row-click="playTrack">
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
        
        <el-table-column width="80">
          <template #default="scope">
            <el-button 
              circle 
              size="small" 
              @click.stop="removeFromFavorites(scope.row)"
              type="danger"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <el-empty 
      v-else 
      description="No favorite tracks yet. Mark songs as favorites from the library."
    />
  </div>
</template>

<style scoped>
.favorites {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.favorites-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
}

.favorites-info {
  display: flex;
  align-items: center;
}

.favorites-cover {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background-color: var(--app-primary-color);
  color: white;
  margin-right: 20px;
}

.favorites-cover .el-icon {
  font-size: 40px;
}

h1 {
  font-size: 24px;
  margin: 0 0 10px 0;
}

.favorites-stats {
  color: var(--el-text-color-secondary);
}

.tracks-list {
  flex: 1;
  overflow: auto;
  border-radius: 8px;
}
</style> 