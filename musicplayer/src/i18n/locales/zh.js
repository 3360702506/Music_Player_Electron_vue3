export default {
  // 通用
  app: {
    name: '音乐播放器',
    loading: '加载中...',
    error: '错误',
    success: '成功',
    cancel: '取消',
    confirm: '确认',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    add: '添加',
    search: '搜索',
    noResults: '未找到结果',
    settings: '设置',
    home: '首页'
  },
  
  // 播放器控制
  player: {
    play: '播放',
    pause: '暂停',
    next: '下一首',
    previous: '上一首',
    shuffle: '随机播放',
    repeat: '循环播放',
    repeatOne: '单曲循环',
    volume: '音量',
    mute: '静音',
    unmute: '取消静音',
    nowPlaying: '正在播放',
    lyrics: '歌词窗口',
    lyricsOpacity: '歌词窗口透明度',
    noLyrics: '未找到歌词',
    fullscreen: '全屏',
    exitFullscreen: '退出全屏',
    visualizer: '可视化效果',
    albumArt: '专辑封面',
    noTrackPlaying: '没有正在播放的歌曲'
  },
  
  // 音乐库
  library: {
    title: '音乐库',
    tracks: '歌曲',
    albums: '专辑',
    artists: '艺术家',
    genres: '流派',
    playlists: '播放列表',
    recentlyAdded: '最近添加',
    recentlyPlayed: '最近播放',
    mostPlayed: '最常播放',
    favorites: '收藏',
    history: '历史记录',
    addToLibrary: '添加到音乐库',
    removeFromLibrary: '从音乐库中移除',
    scanFolder: '扫描文件夹',
    scanFile: '添加文件',
    scanning: '扫描中...',
    scanComplete: '扫描完成',
    tracksFound: '找到 {count} 首歌曲',
    noTracks: '音乐库中没有歌曲',
    folders: '音乐文件夹',
    noFolders: '尚未添加音乐文件夹',
    addFolder: '添加文件夹',
    dropFolderHere: '拖放音乐文件夹到这里'
  },
  
  // 播放列表
  playlist: {
    title: '播放列表',
    new: '新建播放列表',
    create: '创建播放列表',
    edit: '编辑播放列表',
    delete: '删除播放列表',
    deleteConfirm: '确定要删除此播放列表吗？',
    addTo: '添加到播放列表',
    removeFrom: '从播放列表中移除',
    empty: '此播放列表为空',
    untitled: '未命名播放列表'
  },
  
  // 歌曲信息
  track: {
    title: '标题',
    artist: '艺术家',
    album: '专辑',
    genre: '流派',
    year: '年份',
    duration: '时长',
    path: '文件路径',
    size: '文件大小',
    bitrate: '比特率',
    format: '格式',
    addedOn: '添加日期',
    playCount: '播放次数',
    lastPlayed: '最后播放',
    unknown: '未知'
  },
  
  // 设置
  settings: {
    title: '设置',
    language: '语言',
    minimizeToTray: '最小化到托盘',
    confirmReset: '确定要将所有设置重置为默认值吗？',
    theme: {
      title: '主题',
      light: '浅色',
      dark: '深色',
      auto: '自动（跟随系统）',
      system: '系统默认'
    },
    audio: {
      title: '播放',
      output: '输出设备',
      volume: '默认音量',
      equalizer: '均衡器'
    },
    shortcuts: {
      title: '键盘快捷键',
      playPause: '播放/暂停',
      nextTrack: '下一首',
      previousTrack: '上一首',
      volumeUp: '增加音量',
      volumeDown: '降低音量',
      mute: '静音',
      typeNew: '输入新快捷键'
    },
    advanced: {
      title: '系统',
      clearCache: '清除缓存',
      resetSettings: '重置所有设置',
      reset: '重置',
      about: '关于'
    }
  },
  
  // 消息
  messages: {
    fileNotFound: '文件未找到',
    cannotPlayFile: '无法播放此文件',
    errorLoadingTrack: '加载歌曲时出错',
    errorScanningFolder: '扫描文件夹时出错，请确保文件夹中包含受支持的音频格式（mp3, wav, flac等）',
    confirmDeleteTrack: '确定要从音乐库中移除此歌曲吗？',
    settingsSaved: '设置已成功保存',
    playbackError: '播放错误: {error}',
    scanComplete: '扫描完成',
    tracksFound: '找到 {count} 首歌曲',
    electronRequired: '您当前正在浏览器环境中运行此应用，某些功能可能不可用。请使用Electron启动此应用以获得完整功能。'
  }
} 