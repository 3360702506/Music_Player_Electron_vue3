<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMusicStore } from '@/stores/musicStore'

const route = useRoute()
const router = useRouter()
const musicStore = useMusicStore()

const playlistId = computed(() => route.params.id)

const playlist = computed(() => {
  return musicStore.playlists.find(p => p.id === playlistId.value) || null
})

// Set as current playlist when opening
onMounted(() => {
  if (playlist.value) {
    musicStore.setCurrentPlaylist(playlist.value.id)
  } else {
    // If playlist doesn't exist, go back to playlists
    router.push('/playlists')
  }
})

// Play all tracks
const playAll = () => {
  if (playlist.value && playlist.value.tracks.length > 0) {
    musicStore.playTrack(playlist.value.tracks[0])
  }
}

// Play a track
const playTrack = (track) => {
  musicStore.playTrack(track)
}

// Remove from playlist
const removeTrack = (track) => {
  musicStore.removeFromPlaylist(playlistId.value, track.id)
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
  if (!playlist.value) return 0
  
  return playlist.value.tracks.reduce((total, track) => {
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
  <div v-if="playlist" class="playlist-detail">
    <div class="playlist-header">
      <div class="playlist-info">
        <div class="playlist-cover">
          <el-icon v-if="playlist.id === 'favorites'"><StarFilled /></el-icon>
          <el-icon v-else><Folder /></el-icon>
        </div>
        
        <div>
          <h1>{{ playlist.name }}</h1>
          <div class="playlist-stats">
            {{ playlist.tracks.length }} songs · {{ formatTotalDuration }}
          </div>
        </div>
      </div>
      
      <div class="playlist-actions">
        <el-button 
          type="primary" 
          @click="playAll"
          :disabled="playlist.tracks.length === 0"
        >
          <el-icon><VideoPlay /></el-icon>
          Play All
        </el-button>
      </div>
    </div>
    
    <div v-if="playlist.tracks.length > 0" class="tracks-list">
      <el-table :data="playlist.tracks" style="width: 100%" @row-click="playTrack">
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
              @click.stop="removeTrack(scope.row)"
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
      description="This playlist is empty. Add songs from the library."
    />
  </div>
</template>

<style scoped>
.playlist-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.playlist-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
}

.playlist-info {
  display: flex;
  align-items: center;
}

.playlist-cover {
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

.playlist-cover .el-icon {
  font-size: 40px;
}

h1 {
  font-size: 24px;
  margin: 0 0 10px 0;
}

.playlist-stats {
  color: var(--el-text-color-secondary);
}

.tracks-list {
  flex: 1;
  overflow: auto;
  border-radius: 8px;
}
</style> 