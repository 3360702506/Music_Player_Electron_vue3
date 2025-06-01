import { createRouter, createWebHashHistory } from 'vue-router'
import LayoutView from '../views/LayoutView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: LayoutView,
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('../views/HomeView.vue')
        },
        {
          path: 'library',
          name: 'library',
          component: () => import('../views/LibraryView.vue')
        },
        {
          path: 'playlists',
          name: 'playlists',
          component: () => import('../views/PlaylistsView.vue')
        },
        {
          path: 'playlist/:id',
          name: 'playlist-detail',
          component: () => import('../views/PlaylistDetailView.vue'),
          props: true
        },
        {
          path: 'favorites',
          name: 'favorites',
          component: () => import('../views/FavoritesView.vue')
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('../views/SettingsView.vue')
        },
        {
          path: 'history',
          name: 'history',
          component: () => import('../views/HistoryView.vue')
        }
      ]
    },
    {
      path: '/lyrics',
      name: 'lyrics',
      component: () => import('../views/LyricsFloatingView.vue')
    },
    {
      path: '/lyrics-full',
      name: 'lyrics-full',
      component: () => import('../views/LyricsFullView.vue'),
      meta: { transition: 'slide' }
    }
  ]
})

export default router
