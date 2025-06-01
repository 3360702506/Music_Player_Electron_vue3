<script setup>
import { computed } from 'vue'
import { useMusicStore } from '@/stores/musicStore'

const musicStore = useMusicStore()

// Get history entries with track info
const historyEntries = computed(() => {
  return musicStore.playHistory.map(entry => {
    const track = musicStore.musicLibrary.find(t => t.id === entry.trackId)
    return {
      ...entry,
      track
    }
  }).filter(entry => entry.track) // Filter out entries where track is not found
})

// Clear history
const clearHistory = () => {
  musicStore.playHistory.length = 0
}

// Play a track
const playTrack = (track) => {
  if (track) {
    musicStore.playTrack(track)
  }
}

// Format date
const formatDate = (date) => {
  if (!date) return ''
  
  const dateObj = new Date(date)
  const now = new Date()
  
  // If it's today, show time only
  if (dateObj.toDateString() === now.toDateString()) {
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  // If it's within the last 7 days, show day name and time
  const daysAgo = Math.floor((now - dateObj) / (1000 * 60 * 60 * 24))
  if (daysAgo < 7) {
    return `${dateObj.toLocaleDateString([], { weekday: 'short' })} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  }
  
  // Otherwise show full date
  return dateObj.toLocaleDateString()
}
</script>

<template>
  <div class="history">
    <div class="history-header">
      <h1>Play History</h1>
      
      <el-button type="danger" @click="clearHistory" :disabled="historyEntries.length === 0">
        Clear History
      </el-button>
    </div>
    
    <div v-if="historyEntries.length > 0" class="history-list">
      <el-table :data="historyEntries" style="width: 100%">
        <el-table-column width="50">
          <template #default="scope">
            <el-button circle size="small" @click="playTrack(scope.row.track)">
              <el-icon><VideoPlay /></el-icon>
            </el-button>
          </template>
        </el-table-column>
        
        <el-table-column label="Title">
          <template #default="scope">
            {{ scope.row.track?.title || 'Unknown Track' }}
          </template>
        </el-table-column>
        
        <el-table-column label="Artist">
          <template #default="scope">
            {{ scope.row.track?.artist || '-' }}
          </template>
        </el-table-column>
        
        <el-table-column label="Album">
          <template #default="scope">
            {{ scope.row.track?.album || '-' }}
          </template>
        </el-table-column>
        
        <el-table-column label="Played At" width="150">
          <template #default="scope">
            {{ formatDate(scope.row.playedAt) }}
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <el-empty v-else description="No play history yet" />
  </div>
</template>

<style scoped>
.history {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

h1 {
  font-size: 24px;
  margin: 0;
}

.history-list {
  flex: 1;
  overflow: auto;
  border-radius: 8px;
}
</style> 