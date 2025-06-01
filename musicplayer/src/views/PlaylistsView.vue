<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMusicStore } from '@/stores/musicStore'

const router = useRouter()
const musicStore = useMusicStore()

// Create new playlist
const newPlaylistVisible = ref(false)
const newPlaylistName = ref('')

const createPlaylist = () => {
  if (newPlaylistName.value.trim()) {
    musicStore.createPlaylist(newPlaylistName.value.trim())
    newPlaylistName.value = ''
    newPlaylistVisible.value = false
  }
}

// Go to playlist
const openPlaylist = (playlist) => {
  router.push(`/playlist/${playlist.id}`)
}

// Delete playlist
const confirmDeleteVisible = ref(false)
const playlistToDelete = ref(null)

const showDeleteConfirm = (playlist, event) => {
  event.stopPropagation()
  playlistToDelete.value = playlist
  confirmDeleteVisible.value = true
}

const deletePlaylist = () => {
  if (playlistToDelete.value) {
    musicStore.deletePlaylist(playlistToDelete.value.id)
    confirmDeleteVisible.value = false
    playlistToDelete.value = null
  }
}

// Format date
const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString()
}
</script>

<template>
  <div class="playlists">
    <div class="playlists-header">
      <h1>Playlists</h1>
      
      <el-button type="primary" @click="newPlaylistVisible = true">
        <el-icon><Plus /></el-icon>
        New Playlist
      </el-button>
    </div>
    
    <div class="playlists-grid">
      <div 
        v-for="playlist in musicStore.playlists" 
        :key="playlist.id" 
        class="playlist-card"
        @click="openPlaylist(playlist)"
      >
        <div class="playlist-cover">
          <el-icon v-if="playlist.id === 'favorites'"><StarFilled /></el-icon>
          <el-icon v-else><Folder /></el-icon>
        </div>
        
        <div class="playlist-info">
          <div class="playlist-name">{{ playlist.name }}</div>
          <div class="playlist-details">
            {{ playlist.tracks.length }} songs
            <span v-if="playlist.createdAt">
              · Created: {{ formatDate(playlist.createdAt) }}
            </span>
          </div>
        </div>
        
        <div class="playlist-actions" v-if="playlist.id !== 'favorites'">
          <el-button 
            circle 
            size="small" 
            @click="showDeleteConfirm(playlist, $event)"
          >
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
    
    <!-- Create Playlist Dialog -->
    <el-dialog
      v-model="newPlaylistVisible"
      title="Create New Playlist"
      width="30%"
    >
      <el-input 
        v-model="newPlaylistName" 
        placeholder="Playlist Name"
        @keyup.enter="createPlaylist"
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="newPlaylistVisible = false">Cancel</el-button>
          <el-button type="primary" @click="createPlaylist">Create</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- Delete Confirmation Dialog -->
    <el-dialog
      v-model="confirmDeleteVisible"
      title="Delete Playlist"
      width="30%"
    >
      <p>Are you sure you want to delete "{{ playlistToDelete?.name }}"?</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="confirmDeleteVisible = false">Cancel</el-button>
          <el-button type="danger" @click="deletePlaylist">Delete</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.playlists {
  height: 100%;
}

.playlists-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

h1 {
  font-size: 24px;
  margin: 0;
}

.playlists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.playlist-card {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: var(--app-sidebar-color);
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.playlist-card:hover {
  transform: translateY(-3px);
}

.playlist-cover {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background-color: var(--app-primary-color);
  color: white;
  margin-right: 15px;
}

.playlist-cover .el-icon {
  font-size: 30px;
}

.playlist-info {
  flex: 1;
  overflow: hidden;
}

.playlist-name {
  font-weight: bold;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist-details {
  font-size: 0.85rem;
  color: var(--el-text-color-secondary);
}

.playlist-actions {
  margin-left: 10px;
}
</style> 