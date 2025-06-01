# Music Player

A feature-rich music player built with Vue 3 and Electron.

## Features

- 🎵 Local music playback (MP3, FLAC, WAV, AAC, OGG)
- 📊 Music library management with metadata extraction
- 📃 Lyrics support with LRC format
- 📋 Playlist management
- ⭐ Favorites collection
- 🎨 Customizable themes (light/dark/auto)
- 📱 System tray integration
- ⌨️ Global keyboard shortcuts
- 🌈 Audio visualizer
- 🪟 Floating lyrics window
- 📊 Play history tracking

## Development Setup

### Prerequisites

- Node.js (>= 14)
- npm

### Installation

```bash
# Install dependencies
npm install

# Run the app in development mode
npm run electron:dev
```

### Build

```bash
# Build for production
npm run electron:build
```

## Usage

### Adding Music

1. Click "Scan Music" in the sidebar to select a folder containing music files.
2. The application will scan for supported audio files and extract their metadata.
3. Your music will appear in the Library view.

### Playing Music

- Click on any track to play it.
- Use the player controls at the bottom to control playback.
- Adjust volume using the volume slider.

### Playlists

- Create playlists from the Playlists view.
- Add tracks to playlists from the Library or other views.
- Manage playlists by adding or removing tracks.

### Settings

Access various settings from the Settings view:
- Theme customization
- Audio visualizer settings
- Floating lyrics settings
- Global shortcut configuration

## Keyboard Shortcuts

- Play/Pause: `Ctrl+Alt+P`
- Next Track: `Ctrl+Alt+Right`
- Previous Track: `Ctrl+Alt+Left`

These shortcuts can be customized in the Settings view.

## License

MIT
