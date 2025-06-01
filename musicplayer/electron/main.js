const { app, BrowserWindow, ipcMain, dialog, globalShortcut, Menu, Tray } = require('electron')
const path = require("path")
const fs = require('fs')
const url = require('url')
const mm = require('music-metadata')
const { v4: uuidv4 } = require('uuid')

// Keep a global reference of the window objects to prevent garbage collection
let mainWindow = null
let lyricsWindow = null
let tray = null

// Store configuration
let appConfig = {
  scanFolders: [],
  theme: 'light',
  globalShortcuts: {
    playPause: 'CommandOrControl+Alt+P',
    next: 'CommandOrControl+Alt+Right',
    previous: 'CommandOrControl+Alt+Left'
  }
}

// Load configuration if exists
const configPath = path.join(app.getPath('userData'), 'config.json')
try {
  if (fs.existsSync(configPath)) {
    appConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  }
} catch (error) {
  console.error('Failed to load config:', error)
}

// Save configuration function
const saveConfig = () => {
  try {
    fs.writeFileSync(configPath, JSON.stringify(appConfig, null, 2))
  } catch (error) {
    console.error('Failed to save config:', error)
  }
}

// 创建应用菜单
const createAppMenu = () => {
  const isMac = process.platform === 'darwin'
  
  const template = [
    // { role: 'appMenu' }
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    // { role: 'fileMenu' }
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Folder...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            openMusicFolder()
          }
        },
        {
          label: 'Open Music Files...',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: async () => {
            openMusicFiles()
          }
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    // { role: 'viewMenu' }
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    // { role: 'windowMenu' }
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [
          { role: 'close' }
        ])
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            const { shell } = require('electron')
            await shell.openExternal('https://github.com')
          }
        }
      ]
    }
  ]
  
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// 打开音乐文件夹
const openMusicFolder = async () => {
  if (!mainWindow) return null
  
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select Music Folder'
    })
    
    if (!canceled && filePaths.length > 0) {
      // 添加到扫描文件夹
      if (!appConfig.scanFolders.includes(filePaths[0])) {
        appConfig.scanFolders.push(filePaths[0])
        saveConfig()
      }
      
      // 通知渲染进程
      mainWindow.webContents.send('open-folder', filePaths[0])
      return filePaths[0]
    }
    return null
  } catch (error) {
    console.error('Error opening folder:', error)
    return null
  }
}

// 打开音乐文件
const openMusicFiles = async () => {
  if (!mainWindow) return null
  
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      title: 'Select Music Files',
      filters: [
        { name: 'Audio Files', extensions: ['mp3', 'flac', 'wav', 'aac', 'ogg', 'm4a'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    
    if (!canceled && filePaths.length > 0) {
      // 找到第一个文件所在的文件夹
      const firstFilePath = filePaths[0]
      const folderPath = path.dirname(firstFilePath)
      
      // 添加到扫描文件夹（如果文件夹没有被添加过）
      if (!appConfig.scanFolders.includes(folderPath)) {
        appConfig.scanFolders.push(folderPath)
        saveConfig()
      }
      
      // 通知渲染进程
      mainWindow.webContents.send('open-files', filePaths)
      return filePaths
    }
    return null
  } catch (error) {
    console.error('Error opening files:', error)
    return null
  }
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    title: 'Music Player',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      enableRemoteModule: false,
      // 启用更多媒体格式支持
      webSecurity: false,  // 允许本地文件跨域访问
      allowRunningInsecureContent: true,  // 允许运行不安全的内容
    }
  })

  // 注册可播放的媒体格式
  const registerMediaFormats = () => {
    try {
      app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')
      app.commandLine.appendSwitch('enable-features', 'PlatformHEVCDecoderSupport')
      console.log('已注册媒体格式支持')
    } catch (error) {
      console.error('注册媒体格式支持失败:', error)
    }
  }

  // 在app ready前设置命令行参数
  registerMediaFormats()

  const isDevelopment = process.env.NODE_ENV !== 'production'
  
  if (isDevelopment) {
    // Dev mode - connect to Vite dev server
    mainWindow.loadURL("http://localhost:5173/");
    // Open DevTools in dev mode
    mainWindow.webContents.openDevTools()
  } else {
    // Production mode - load the built files
    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, '../dist/index.html'),
      protocol: 'file:',
      slashes: true
    }))
  }

  // Handle window close
  mainWindow.on('close', (event) => {
    // Minimize to tray instead of closing directly
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow.hide()
      return false
    }
    return true
  })
}

// Create floating lyrics window
const createLyricsWindow = () => {
  if (lyricsWindow) {
    lyricsWindow.show()
    console.log('显示已存在的歌词窗口')
    return
  }

  console.log('创建新的歌词窗口')
  
  lyricsWindow = new BrowserWindow({
    width: 800,
    height: 200,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  const isDevelopment = process.env.NODE_ENV !== 'production'
  
  if (isDevelopment) {
    lyricsWindow.loadURL("http://localhost:5173/#/lyrics")
      .then(() => {
        console.log('歌词窗口成功加载开发服务器URL')
      })
      .catch(err => {
        console.error('加载歌词窗口开发服务器URL失败:', err)
      });
  } else {
    lyricsWindow.loadURL(url.format({
      pathname: path.join(__dirname, '../dist/index.html'),
      protocol: 'file:',
      hash: 'lyrics',
      slashes: true
    }))
      .then(() => {
        console.log('歌词窗口成功加载生产环境URL')
      })
      .catch(err => {
        console.error('加载歌词窗口生产环境URL失败:', err)
      });
  }

  lyricsWindow.on('closed', () => {
    console.log('歌词窗口已关闭')
    lyricsWindow = null
  })
  
  // 监听窗口准备就绪事件
  lyricsWindow.webContents.on('did-finish-load', () => {
    console.log('歌词窗口内容加载完成')
  })

  // 设置窗口可拖动
  lyricsWindow.setMovable(true)
  
  // 设置窗口可调整大小
  lyricsWindow.setResizable(true)
  
  // 创建右键菜单
  const contextMenu = Menu.buildFromTemplate([
    { label: '关闭歌词窗口', click: () => lyricsWindow.hide() },
    { type: 'separator' },
    { label: '透明度', submenu: [
      { label: '100%', click: () => lyricsWindow.setOpacity(1.0) },
      { label: '75%', click: () => lyricsWindow.setOpacity(0.75) },
      { label: '50%', click: () => lyricsWindow.setOpacity(0.5) },
    ]},
    { type: 'separator' },
    { label: '总是置顶', type: 'checkbox', checked: true, click: (menuItem) => {
      lyricsWindow.setAlwaysOnTop(menuItem.checked)
    }}
  ])
  
  // 添加右键菜单
  lyricsWindow.webContents.on('context-menu', (e, params) => {
    contextMenu.popup(lyricsWindow)
  })
  
  console.log('歌词窗口创建成功')
}

// Create system tray
const createTray = () => {
  try {
    // 使用项目中的logo图标
    const nativeImage = require('electron').nativeImage
    const iconPath = path.join(__dirname, '../..', 'assets', 'logo.png')
    const icon = nativeImage.createFromPath(iconPath)
    
    tray = new Tray(icon)
    
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Show Player', click: () => mainWindow.show() },
      { type: 'separator' },
      { label: 'Play/Pause', click: () => mainWindow.webContents.send('tray-play-pause') },
      { label: 'Next', click: () => mainWindow.webContents.send('tray-next') },
      { label: 'Previous', click: () => mainWindow.webContents.send('tray-previous') },
      { type: 'separator' },
      { label: 'Quit', click: () => { app.isQuitting = true; app.quit() } }
    ])
    
    tray.setToolTip('Music Player')
    tray.setContextMenu(contextMenu)
    
    tray.on('click', () => {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
    })
  } catch (error) {
    console.error('Failed to create tray:', error)
  }
}

// Set up global shortcuts
const registerGlobalShortcuts = () => {
  // Unregister any existing shortcuts
  globalShortcut.unregisterAll()

  // Register configured shortcuts
  globalShortcut.register(appConfig.globalShortcuts.playPause, () => {
    mainWindow.webContents.send('global-play-pause')
  })
  
  globalShortcut.register(appConfig.globalShortcuts.next, () => {
    mainWindow.webContents.send('global-next')
  })
  
  globalShortcut.register(appConfig.globalShortcuts.previous, () => {
    mainWindow.webContents.send('global-previous')
  })
}

// IPC handlers
const setupIPC = () => {
  // Open folder dialog
  ipcMain.handle('open-folder-dialog', async () => {
    const folderPath = await openMusicFolder()
    return folderPath
  })

  // Update config
  ipcMain.handle('update-config', (event, newConfig) => {
    appConfig = { ...appConfig, ...newConfig }
    saveConfig()
    
    // If shortcuts were updated, re-register them
    if (newConfig.globalShortcuts) {
      registerGlobalShortcuts()
    }
    
    return true
  })

  // Get config
  ipcMain.handle('get-config', () => {
    return appConfig
  })

  // Toggle lyrics window
  ipcMain.handle('toggle-lyrics-window', () => {
    console.log('切换歌词窗口显示状态')
    if (lyricsWindow && !lyricsWindow.isDestroyed()) {
      if (lyricsWindow.isVisible()) {
        console.log('歌词窗口当前可见，隐藏它')
        lyricsWindow.hide()
        return false
      } else {
        console.log('歌词窗口当前隐藏，显示它')
        lyricsWindow.show()
        return true
      }
    } else {
      console.log('歌词窗口不存在，创建新窗口')
      createLyricsWindow()
      return true
    }
  })

  // Update lyrics
  ipcMain.on('update-lyrics', (event, data) => {
    try {
      console.log('接收到歌词更新:', 
        data?.title || '无标题', 
        data?.artist || '未知艺术家',
        data?.lyrics?.length || 0, '条歌词'
      )
      
      // 确保歌词窗口存在并已加载
      if (!lyricsWindow || lyricsWindow.isDestroyed()) {
        console.log('歌词窗口不存在，创建新窗口')
        createLyricsWindow()
        
        // 延迟发送歌词数据，确保窗口已加载
        setTimeout(() => {
          if (lyricsWindow && !lyricsWindow.isDestroyed()) {
            console.log('延迟发送歌词数据到新创建的窗口')
            lyricsWindow.webContents.send('lyrics-data', data)
          }
        }, 1000)
      } else {
        // 确保窗口可见
        if (!lyricsWindow.isVisible()) {
          console.log('歌词窗口不可见，显示它')
          lyricsWindow.show()
        }
        
        console.log('发送歌词数据到现有窗口')
        lyricsWindow.webContents.send('lyrics-data', data)
      }
    } catch (error) {
      console.error('处理歌词更新时出错:', error)
    }
  })
  
  // 新增：扫描音乐文件夹或文件
  ipcMain.handle('scan-music-folder', async (event, folderPath, isSingleFile) => {
    try {
      console.log(`主进程：开始扫描 ${isSingleFile ? '文件' : '文件夹'}: ${folderPath}`)
      
      if (isSingleFile) {
        // 处理单个文件
        const supportedFormats = ['.mp3', '.flac', '.wav', '.aac', '.ogg', '.m4a']
        const fileExt = path.extname(folderPath).toLowerCase()
        
        if (!supportedFormats.includes(fileExt)) {
          return { success: false, trackCount: 0, message: "不是支持的音频文件格式" }
        }
        
        try {
          console.log("处理音乐文件:", folderPath)
          
          // 检查文件是否存在且可读
          try {
            await fs.promises.access(folderPath, fs.constants.R_OK)
          } catch (accessError) {
            console.error(`文件不存在或无法访问: ${folderPath}`, accessError)
            return {
              success: false,
              trackCount: 0,
              message: `文件不存在或无法访问: ${accessError.message}`
            }
          }
          
          // 检查文件大小
          let fileStats
          try {
            fileStats = await fs.promises.stat(folderPath)
            if (fileStats.size === 0) {
              console.error(`文件大小为0: ${folderPath}`)
              return {
                success: false,
                trackCount: 0,
                message: "文件大小为0，可能已损坏"
              }
            }
          } catch (statError) {
            console.error(`获取文件状态失败: ${folderPath}`, statError)
            return {
              success: false,
              trackCount: 0,
              message: `获取文件状态失败: ${statError.message}`
            }
          }
          
          // 解析音频元数据，使用更健壮的错误处理
          let metadata
          try {
            // 使用更安全的方式读取元数据
            metadata = await mm.parseFile(folderPath, { 
              duration: true,
              skipCovers: false,  // 仍然获取封面
              skipPostHeaders: true, // 跳过一些可能导致问题的后置头信息
              fileSize: fileStats.size // 提供文件大小可以帮助避免某些读取错误
            }).catch(error => {
              throw error;  // 确保错误被捕获
            });
          } catch (mmError) {
            console.error(`Error parsing metadata for file ${folderPath}:`, mmError)
            // 创建基本元数据，避免处理失败
            metadata = {
              common: {
                title: path.basename(folderPath, path.extname(folderPath)),
                artist: 'Unknown Artist',
                album: 'Unknown Album',
                year: null,
                genre: []
              },
              format: {
                duration: 0
              }
            }
          }
          
          const id = `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          
          const track = {
            id,
            path: folderPath,
            title: metadata.common.title || path.basename(folderPath, path.extname(folderPath)),
            artist: metadata.common.artist || 'Unknown Artist',
            album: metadata.common.album || 'Unknown Album',
            duration: metadata.format.duration || 0,
            year: metadata.common.year,
            genre: metadata.common.genre,
            fileSize: fileStats.size,
            lastModified: fileStats.mtime.toISOString(),
            playCount: 0,
            lastPlayed: null,
            dateAdded: new Date().toISOString(),
          }
          
          // 尝试找到匹配的歌词文件（更全面的检查）
          // 1. 首先检查同名.lrc文件
          const lyricsPath1 = folderPath.replace(path.extname(folderPath), '.lrc')
          // 2. 检查"歌手 - 歌名.lrc"格式
          const artistTitle = `${track.artist} - ${track.title}.lrc`
          const lyricsPath2 = path.join(path.dirname(folderPath), artistTitle)
          // 3. 检查"歌名.lrc"格式
          const titleOnly = `${track.title}.lrc`
          const lyricsPath3 = path.join(path.dirname(folderPath), titleOnly)
          
          // 按优先级顺序检查各个路径
          if (fs.existsSync(lyricsPath1)) {
            track.lyricsPath = lyricsPath1
            console.log('找到歌词文件(同名):', lyricsPath1)
          } else if (fs.existsSync(lyricsPath2)) {
            track.lyricsPath = lyricsPath2
            console.log('找到歌词文件(艺术家-标题):', lyricsPath2)
          } else if (fs.existsSync(lyricsPath3)) {
            track.lyricsPath = lyricsPath3
            console.log('找到歌词文件(仅标题):', lyricsPath3)
          } else {
            console.log('未找到歌词文件:', track.title)
          }
          
          // 处理专辑封面
          if (metadata.common.picture && metadata.common.picture.length > 0) {
            try {
              const picture = metadata.common.picture[0]
              const coverPath = path.join(app.getPath('userData'), 'covers', `${id}.${picture.format.split('/')[1]}`)
              
              // 确保目录存在
              const coverDir = path.dirname(coverPath)
              if (!fs.existsSync(coverDir)) {
                fs.mkdirSync(coverDir, { recursive: true })
              }
              
              fs.writeFileSync(coverPath, picture.data)
              track.coverPath = coverPath
            } catch (coverError) {
              console.error("Error saving cover image:", coverError)
            }
          }
          
          return {
            success: true,
            trackCount: 1,
            tracks: [track],
            message: "成功添加1首歌曲"
          }
        } catch (error) {
          console.error(`Error processing file ${folderPath}:`, error)
          return {
            success: false,
            trackCount: 0,
            message: `处理文件出错: ${error.message}`
          }
        }
      } else {
        // 处理文件夹
        const files = await readDirectoryRecursive(folderPath)
        console.log("找到文件数量:", files.length)
        
        const supportedFormats = ['.mp3', '.flac', '.wav', '.aac', '.ogg', '.m4a']
        const musicFiles = files.filter(file => 
          supportedFormats.includes(path.extname(file).toLowerCase())
        )
        console.log("找到音乐文件数量:", musicFiles.length)
        
        if (musicFiles.length === 0) {
          return { success: false, trackCount: 0, message: "未找到音乐文件" }
        }
        
        const tracks = []
        let errorCount = 0
        
        for (const file of musicFiles) {
          try {
            console.log("处理音乐文件:", file)
            
            // 检查文件是否存在且可读
            try {
              await fs.promises.access(file, fs.constants.R_OK)
            } catch (accessError) {
              console.error(`文件不存在或无法访问: ${file}`, accessError)
              errorCount++
              continue
            }
            
            // 检查文件大小
            let fileStats
            try {
              fileStats = await fs.promises.stat(file)
              if (fileStats.size === 0) {
                console.error(`文件大小为0: ${file}`)
                errorCount++
                continue
              }
            } catch (statError) {
              console.error(`获取文件状态失败: ${file}`, statError)
              errorCount++
              continue
            }
            
            // 解析音频元数据，使用更健壮的错误处理
            let metadata
            try {
              // 使用更安全的方式读取元数据
              metadata = await mm.parseFile(file, { 
                duration: true,
                skipCovers: false,  // 仍然获取封面
                skipPostHeaders: true, // 跳过一些可能导致问题的后置头信息
                fileSize: fileStats.size // 提供文件大小可以帮助避免某些读取错误
              }).catch(error => {
                throw error;  // 确保错误被捕获
              });
            } catch (mmError) {
              console.error(`Error parsing metadata for file ${file}:`, mmError)
              // 创建基本元数据，避免处理失败
              metadata = {
                common: {
                  title: path.basename(file, path.extname(file)),
                  artist: 'Unknown Artist',
                  album: 'Unknown Album',
                  year: null,
                  genre: []
                },
                format: {
                  duration: 0
                }
              }
            }
            
            const id = `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            
            const track = {
              id,
              path: file,
              title: metadata.common.title || path.basename(file, path.extname(file)),
              artist: metadata.common.artist || 'Unknown Artist',
              album: metadata.common.album || 'Unknown Album',
              duration: metadata.format.duration || 0,
              year: metadata.common.year,
              genre: metadata.common.genre,
              fileSize: fileStats.size,
              lastModified: fileStats.mtime.toISOString(),
              playCount: 0,
              lastPlayed: null,
              dateAdded: new Date().toISOString(),
            }
            
            // 尝试找到匹配的歌词文件（更全面的检查）
            // 1. 首先检查同名.lrc文件
            const lyricsPath1 = file.replace(path.extname(file), '.lrc')
            // 2. 检查"歌手 - 歌名.lrc"格式
            const artistTitle = `${track.artist} - ${track.title}.lrc`
            const lyricsPath2 = path.join(path.dirname(file), artistTitle)
            // 3. 检查"歌名.lrc"格式
            const titleOnly = `${track.title}.lrc`
            const lyricsPath3 = path.join(path.dirname(file), titleOnly)
            
            // 按优先级顺序检查各个路径
            if (fs.existsSync(lyricsPath1)) {
              track.lyricsPath = lyricsPath1
              console.log('找到歌词文件(同名):', lyricsPath1)
            } else if (fs.existsSync(lyricsPath2)) {
              track.lyricsPath = lyricsPath2
              console.log('找到歌词文件(艺术家-标题):', lyricsPath2)
            } else if (fs.existsSync(lyricsPath3)) {
              track.lyricsPath = lyricsPath3
              console.log('找到歌词文件(仅标题):', lyricsPath3)
            } else {
              console.log('未找到歌词文件:', track.title)
            }
            
            // 处理专辑封面
            if (metadata.common.picture && metadata.common.picture.length > 0) {
              try {
                const picture = metadata.common.picture[0]
                const coverPath = path.join(app.getPath('userData'), 'covers', `${id}.${picture.format.split('/')[1]}`)
                
                // 确保目录存在
                const coverDir = path.dirname(coverPath)
                if (!fs.existsSync(coverDir)) {
                  fs.mkdirSync(coverDir, { recursive: true })
                }
                
                fs.writeFileSync(coverPath, picture.data)
                track.coverPath = coverPath
              } catch (coverError) {
                console.error("Error saving cover image:", coverError)
              }
            }
            
            tracks.push(track)
          } catch (error) {
            console.error(`Error parsing metadata for file ${file}:`, error)
            errorCount++
          }
        }
        
        console.log(`处理完成：成功 ${tracks.length} 首，失败 ${errorCount} 首`)
        
        return {
          success: true,
          trackCount: tracks.length,
          tracks: tracks,
          message: `成功添加 ${tracks.length} 首歌曲`
        }
      }
    } catch (error) {
      console.error("扫描音乐文件时出错:", error)
      return {
        success: false,
        trackCount: 0,
        message: `扫描出错: ${error.message}`
      }
    }
  })
  
  // 新增：读取歌词文件
  ipcMain.handle('read-lyrics-file', async (event, lyricsPath) => {
    try {
      console.log('尝试读取歌词文件:', lyricsPath)
      
      if (!lyricsPath) {
        console.error('歌词路径为空')
        return null
      }
      
      // 检查文件是否存在
      try {
        await fs.promises.access(lyricsPath, fs.constants.R_OK)
      } catch (accessError) {
        console.error(`歌词文件不存在或无法访问: ${lyricsPath}`, accessError)
        return null
      }
      
      // 检查文件大小
      let stats
      try {
        stats = await fs.promises.stat(lyricsPath)
        console.log('歌词文件大小:', stats.size, '字节')
        
        if (stats.size === 0) {
          console.error('歌词文件大小为0:', lyricsPath)
          return null
        }
        
        if (stats.size > 1024 * 1024) { // 超过1MB的歌词文件可能有问题
          console.warn('歌词文件过大:', lyricsPath, stats.size, '字节')
        }
      } catch (statError) {
        console.error('获取歌词文件信息失败:', statError)
        return null
      }
      
      // 读取歌词文件内容
      let lyricsText
      try {
        lyricsText = await fs.promises.readFile(lyricsPath, { encoding: 'utf-8' })
        console.log('成功读取歌词文件，长度:', lyricsText?.length || 0)
      } catch (readError) {
        console.error('读取歌词文件内容失败:', readError)
        
        // 尝试使用其他编码读取
        try {
          // 尝试使用 latin1 编码读取
          lyricsText = await fs.promises.readFile(lyricsPath, { encoding: 'latin1' })
          console.log('使用latin1编码成功读取歌词文件，长度:', lyricsText?.length || 0)
        } catch (retryError) {
          console.error('使用备用编码读取歌词文件失败:', retryError)
          return null
        }
      }
      
      // 简单验证一下是否是LRC格式（包含时间标记）
      if (!lyricsText || !lyricsText.includes('[') || !lyricsText.includes(']')) {
        console.warn('歌词文件可能不是LRC格式:', lyricsPath)
      }
      
      return lyricsText
    } catch (error) {
      console.error("读取歌词文件出错:", error)
      return null
    }
  })
  
  // 新增：获取文件协议URL
  ipcMain.handle('get-file-url', async (event, filePath) => {
    try {
      if (!filePath) {
        console.error('文件路径为空')
        return null
      }
      
      // 检查文件是否存在且可读
      try {
        await fs.promises.access(filePath, fs.constants.R_OK)
      } catch (accessError) {
        console.error('文件不存在或无法访问:', filePath, accessError)
        return null
      }
      
      // 检查文件大小
      try {
        const stats = await fs.promises.stat(filePath)
        console.log('文件大小:', stats.size, '字节')
        
        if (stats.size === 0) {
          console.error('文件大小为0:', filePath)
          return null
        }
      } catch (statError) {
        console.error('获取文件信息失败:', statError)
        // 继续处理，因为我们至少知道文件存在
      }
      
      // 将路径转换为有效的文件URL
      let fileUrl = filePath
      
      // Windows路径处理
      if (fileUrl.includes('\\')) {
        fileUrl = fileUrl.replace(/\\/g, '/')
      }
      
      // 确保路径格式正确
      if (!fileUrl.startsWith('file://')) {
        // 确保路径有三个斜杠：file:///
        fileUrl = `file:///${fileUrl}`
      }
      
      // 修复可能的双斜杠（除了协议部分）
      fileUrl = fileUrl.replace(/([^:])\/\//g, '$1/')
      
      // 编码URL中的特殊字符
      try {
        // 分解URL，只编码路径部分
        const urlParts = fileUrl.split('://');
        if (urlParts.length > 1) {
          // 确保不对已编码的字符重复编码
          const encodedPath = urlParts[1].split('/').map(segment => 
            // 检查是否已编码
            segment.includes('%') ? segment : encodeURIComponent(segment)
          ).join('/');
          
          fileUrl = `${urlParts[0]}://${encodedPath}`;
        }
      } catch (encodeError) {
        console.warn('URL编码失败，使用原始URL:', encodeError)
      }
      
      console.log("文件URL:", fileUrl)
      return fileUrl
    } catch (error) {
      console.error("处理文件URL时出错:", error)
      return null
    }
  })
  
  // 新增：使用系统默认程序打开文件
  ipcMain.handle('open-file', async (event, filePath) => {
    try {
      if (!filePath || !fs.existsSync(filePath)) {
        console.error('文件不存在:', filePath)
        return false
      }
      
      // 使用Electron的shell.openExternal打开文件
      const { shell } = require('electron')
      const fileUrl = url.pathToFileURL(filePath).href
      await shell.openExternal(fileUrl)
      return true
    } catch (error) {
      console.error('打开文件出错:', error)
      return false
    }
  })
  
  // 新增：获取文件数据
  ipcMain.handle('get-file-data', async (event, filePath) => {
    try {
      if (!filePath || !fs.existsSync(filePath)) {
        console.error('文件不存在:', filePath)
        return null
      }
      
      // 检查文件大小
      const stats = fs.statSync(filePath)
      console.log('文件大小:', stats.size, '字节')
      
      // 限制文件大小为50MB，防止内存溢出
      if (stats.size > 50 * 1024 * 1024) {
        console.error('文件太大，超过50MB:', filePath)
        return null
      }
      
      // 读取文件
      const buffer = fs.readFileSync(filePath)
      console.log('成功读取文件数据，大小:', buffer.length, '字节')
      
      return buffer.buffer
    } catch (error) {
      console.error('读取文件数据失败:', error)
      return null
    }
  })
}

// 读取目录及其子目录中的所有文件
async function readDirectoryRecursive(dirPath) {
  const files = []
  let items = []
  
  try {
    items = fs.readdirSync(dirPath)
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error)
    return files
  }
  
  for (const item of items) {
    try {
      const itemPath = path.join(dirPath, item)
      const stats = fs.statSync(itemPath)
      
      if (stats.isDirectory()) {
        const subDirFiles = await readDirectoryRecursive(itemPath)
        files.push(...subDirFiles)
      } else {
        files.push(itemPath)
      }
    } catch (error) {
      console.error(`Error processing item ${item} in ${dirPath}:`, error)
    }
  }
  
  return files
}

app.whenReady().then(() => {
  createWindow()
  createAppMenu()
  createTray()
  setupIPC()
  registerGlobalShortcuts()
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else {
      mainWindow.show()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
