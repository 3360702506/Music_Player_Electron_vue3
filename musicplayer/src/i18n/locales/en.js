export default {
  // Common
  app: {
    name: 'Music Player',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    noResults: 'No results found',
    settings: 'Settings',
    home: 'Home'
  },
  
  // Player controls
  player: {
    play: 'Play',
    pause: 'Pause',
    next: 'Next',
    previous: 'Previous',
    shuffle: 'Shuffle',
    repeat: 'Repeat',
    repeatOne: 'Repeat One',
    volume: 'Volume',
    mute: 'Mute',
    unmute: 'Unmute',
    nowPlaying: 'Now Playing',
    lyrics: 'Floating Lyrics Window',
    lyricsOpacity: 'Lyrics Window Opacity',
    noLyrics: 'No lyrics found',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit Fullscreen',
    visualizer: 'Visualizer',
    albumArt: 'Album Art',
    noTrackPlaying: 'No track playing'
  },
  
  // Library
  library: {
    title: 'Library',
    tracks: 'Tracks',
    albums: 'Albums',
    artists: 'Artists',
    genres: 'Genres',
    playlists: 'Playlists',
    recentlyAdded: 'Recently Added',
    recentlyPlayed: 'Recently Played',
    mostPlayed: 'Most Played',
    favorites: 'Favorites',
    history: 'History',
    addToLibrary: 'Add to Library',
    removeFromLibrary: 'Remove from Library',
    scanFolder: 'Scan Folder',
    scanFile: 'Add File',
    scanning: 'Scanning...',
    scanComplete: 'Scan Complete',
    tracksFound: '{count} tracks found',
    noTracks: 'No tracks in your library',
    folders: 'Music Folders',
    noFolders: 'No music folders added yet',
    addFolder: 'Add Folder',
    dropFolderHere: 'Drop music folder here'
  },
  
  // Playlists
  playlist: {
    title: 'Playlists',
    new: 'New Playlist',
    create: 'Create Playlist',
    edit: 'Edit Playlist',
    delete: 'Delete Playlist',
    deleteConfirm: 'Are you sure you want to delete this playlist?',
    addTo: 'Add to Playlist',
    removeFrom: 'Remove from Playlist',
    empty: 'This playlist is empty',
    untitled: 'Untitled Playlist'
  },
  
  // Track info
  track: {
    title: 'Title',
    artist: 'Artist',
    album: 'Album',
    genre: 'Genre',
    year: 'Year',
    duration: 'Duration',
    path: 'File Path',
    size: 'File Size',
    bitrate: 'Bitrate',
    format: 'Format',
    addedOn: 'Added On',
    playCount: 'Play Count',
    lastPlayed: 'Last Played',
    unknown: 'Unknown'
  },
  
  // Settings
  settings: {
    title: 'Settings',
    language: 'Language',
    minimizeToTray: 'Minimize to Tray',
    confirmReset: 'Are you sure you want to reset all settings to default?',
    theme: {
      title: 'Theme',
      light: 'Light',
      dark: 'Dark',
      auto: 'Auto (System)',
      system: 'System Default'
    },
    audio: {
      title: 'Playback',
      output: 'Output Device',
      volume: 'Default Volume',
      equalizer: 'Equalizer'
    },
    shortcuts: {
      title: 'Keyboard Shortcuts',
      playPause: 'Play/Pause',
      nextTrack: 'Next Track',
      previousTrack: 'Previous Track',
      volumeUp: 'Volume Up',
      volumeDown: 'Volume Down',
      mute: 'Mute',
      typeNew: 'Type new shortcut'
    },
    advanced: {
      title: 'System',
      clearCache: 'Clear Cache',
      resetSettings: 'Reset All Settings',
      reset: 'Reset',
      about: 'About'
    }
  },
  
  // Messages
  messages: {
    fileNotFound: 'File not found',
    cannotPlayFile: 'Cannot play this file',
    errorLoadingTrack: 'Error loading track',
    errorScanningFolder: 'Error scanning folder. Please ensure it contains supported audio formats (mp3, wav, flac, etc.)',
    confirmDeleteTrack: 'Are you sure you want to remove this track from your library?',
    settingsSaved: 'Settings saved successfully',
    playbackError: 'Playback error: {error}',
    scanComplete: 'Scan complete',
    tracksFound: '{count} tracks found',
    electronRequired: 'You are currently running this app in a browser environment. Some features may not be available. Please launch with Electron for full functionality.'
  }
} 