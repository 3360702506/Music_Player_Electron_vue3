<script setup>
import { ref, computed } from 'vue'
import { useMusicStore } from '@/stores/musicStore'

const musicStore = useMusicStore()

// Search functionality
const searchQuery = ref('')
const filteredLibrary = computed(() => {
  if (!searchQuery.value) {
    return musicStore.musicLibrary
  }
  return musicStore.searchLibrary(searchQuery.value)
})

// Sorting
const sortField = ref('title')
const sortDirection = ref('asc')

const sortedLibrary = computed(() => {
  return musicStore.sortLibrary(sortField.value, sortDirection.value)
})

// Final library with both search and sort applied
const displayedLibrary = computed(() => {
  if (!searchQuery.value) {
    return sortedLibrary.value
  }
  
  return [...filteredLibrary.value].sort((a, b) => {
    let valueA = a[sortField.value]
    let valueB = b[sortField.value]
    
    // Handle special cases
    if (sortField.value === 'dateAdded' || sortField.value === 'lastPlayed') {
      valueA = valueA ? new Date(valueA).getTime() : 0
      valueB = valueB ? new Date(valueB).getTime() : 0
    } else if (typeof valueA === 'string') {
      valueA = valueA.toLowerCase()
      valueB = valueB.toLowerCase()
    }
    
    if (valueA === valueB) return 0
    if (valueA > valueB) return sortDirection.value === 'asc' ? 1 : -1
    return sortDirection.value === 'asc' ? -1 : 1
  })
})

// Sort table
const handleSortChange = (column) => {
  // If clicking the same column, toggle direction
  if (sortField.value === column.prop) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = column.prop
    sortDirection.value = 'asc'
  }
}

// Play a track
const playTrack = (track) => {
  musicStore.playTrack(track)
}

// Toggle favorite status
const toggleFavorite = (track, event) => {
  event.stopPropagation()
  musicStore.toggleFavorite(track)
}

// Format duration (seconds to MM:SS)
const formatDuration = (seconds) => {
  if (!seconds) return '0:00'
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Format date
const formatDate = (dateString) => {
  if (!dateString) return '-'
  
  const date = new Date(dateString)
  return date.toLocaleDateString()
}
</script>

<template>
  <div class="library">
    <div class="library-header">
      <h1>Music Library</h1>
      
      <div class="search-container">
        <el-input
          v-model="searchQuery"
          placeholder="Search by title, artist, album..."
          clearable
          prefix-icon="Search"
        />
      </div>
    </div>
    
    <div v-if="displayedLibrary.length > 0" class="library-content">
      <el-table
        :data="displayedLibrary"
        style="width: 100%"
        @row-click="playTrack"
        @sort-change="handleSortChange"
      >
        <el-table-column width="50">
          <template #default="scope">
            <el-button circle size="small" @click.stop="playTrack(scope.row)">
              <el-icon><VideoPlay /></el-icon>
            </el-button>
          </template>
        </el-table-column>
        
        <el-table-column width="50">
          <template #default="scope">
            <el-button 
              circle 
              size="small" 
              @click.stop="toggleFavorite(scope.row, $event)"
            >
              <el-icon>
                <component :is="musicStore.isFavorite(scope.row) ? 'StarFilled' : 'Star'" />
              </el-icon>
            </el-button>
          </template>
        </el-table-column>
        
        <el-table-column label="Title" prop="title" sortable />
        <el-table-column label="Artist" prop="artist" sortable />
        <el-table-column label="Album" prop="album" sortable />
        
        <el-table-column label="Duration" width="100" prop="duration" sortable>
          <template #default="scope">
            {{ formatDuration(scope.row.duration) }}
          </template>
        </el-table-column>
        
        <el-table-column label="Year" width="80" prop="year" sortable />
        
        <el-table-column label="Date Added" width="120" prop="dateAdded" sortable>
          <template #default="scope">
            {{ formatDate(scope.row.dateAdded) }}
          </template>
        </el-table-column>
        
        <el-table-column label="Plays" width="80" prop="playCount" sortable />
      </el-table>
    </div>
    
    <el-empty v-else description="No music files found. Add music using the 'Scan Music' button." />
  </div>
</template>

<style scoped>
.library {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.library-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

h1 {
  font-size: 24px;
  margin: 0;
}

.search-container {
  width: 300px;
}

.library-content {
  flex: 1;
  overflow: auto;
  border-radius: 8px;
}
</style> 