const { contextBridge, ipcRenderer } = require('electron')

// 在窗口加载时执行
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM内容加载完成，初始化预加载脚本')
})

// 通过预加载脚本暴露 Electron API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 文件系统功能
  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
  
  // 新增：扫描音乐文件夹或文件
  scanMusicFolder: (folderPath, isSingleFile) => ipcRenderer.invoke('scan-music-folder', folderPath, isSingleFile),
  
  // 新增：读取歌词文件
  readLyricsFile: (lyricsPath) => ipcRenderer.invoke('read-lyrics-file', lyricsPath),
  
  // 新增：获取文件协议URL
  getFileUrl: (filePath) => ipcRenderer.invoke('get-file-url', filePath),
  
  // 新增：使用系统默认程序打开文件
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
  
  // 新增：获取文件数据
  getFileData: (filePath) => ipcRenderer.invoke('get-file-data', filePath),
  
  // 配置功能
  getConfig: () => ipcRenderer.invoke('get-config'),
  updateConfig: (config) => ipcRenderer.invoke('update-config', config),
  
  // 歌词窗口
  toggleLyricsWindow: () => ipcRenderer.invoke('toggle-lyrics-window'),
  updateLyrics: (data) => ipcRenderer.send('update-lyrics', data),
  
  // 菜单事件监听
  onOpenFolder: (callback) => {
    const handler = (_, folderPath) => callback(folderPath)
    ipcRenderer.on('open-folder', handler)
    return () => ipcRenderer.removeListener('open-folder', handler)
  },
  
  onOpenFiles: (callback) => {
    const handler = (_, filePaths) => callback(filePaths)
    ipcRenderer.on('open-files', handler)
    return () => ipcRenderer.removeListener('open-files', handler)
  },
  
  // 托盘菜单事件监听
  onTrayPlayPause: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('tray-play-pause', handler)
    return () => ipcRenderer.removeListener('tray-play-pause', handler)
  },
  
  onTrayNext: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('tray-next', handler)
    return () => ipcRenderer.removeListener('tray-next', handler)
  },
  
  onTrayPrevious: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('tray-previous', handler)
    return () => ipcRenderer.removeListener('tray-previous', handler)
  },
  
  // 全局快捷键事件监听
  onGlobalPlayPause: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('global-play-pause', handler)
    return () => ipcRenderer.removeListener('global-play-pause', handler)
  },
  
  onGlobalNext: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('global-next', handler)
    return () => ipcRenderer.removeListener('global-next', handler)
  },
  
  onGlobalPrevious: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('global-previous', handler)
    return () => ipcRenderer.removeListener('global-previous', handler)
  },

  onLyricsData: (callback) => {
    const handler = (_, data) => callback(data)
    ipcRenderer.on('lyrics-data', handler)
    return () => ipcRenderer.removeListener('lyrics-data', handler)
  },
  
  // 清理监听器
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
})

// 当页面是歌词页面时，监听歌词数据
if (window.location.hash === '#/lyrics') {
  console.log('歌词页面加载，准备接收歌词数据')
  
  ipcRenderer.on('lyrics-data', (event, data) => {
    console.log('歌词页面收到歌词数据:', data?.title, data?.lyrics?.length || 0, '条')
    // 将事件发送到window对象，以便Vue组件可以监听
    window.dispatchEvent(new CustomEvent('lyrics-updated', { detail: data }))
  })
}
