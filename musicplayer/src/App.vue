<script setup>
import { onMounted } from 'vue'
import { useSettingsStore } from './stores/settingsStore'
import { useI18n } from 'vue-i18n'

const settingsStore = useSettingsStore()
const { t } = useI18n()

onMounted(() => {
  // 应用主题
  settingsStore.applyTheme()
  
  // 设置页面标题
  document.title = t('app.name')
})
</script>

<template>
  <div id="app">
    <router-view v-slot="{ Component, route }" class="router-view-container">
      <transition :name="route.meta.transition || 'fade'" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<style>
#app{
  padding: 0;
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

/* Reset CSS */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

/* Define theme variables */
:root {
  --app-primary-color: #409EFF;
  --app-secondary-color: #79bbff;
  --app-bg-color: #f5f7fa;
  --app-sidebar-color: #ffffff;
  --app-text-color: #303133;
  --app-border-color: #e4e7ed;
}

html[data-theme='dark'] {
  --app-primary-color: #409EFF;
  --app-secondary-color: #79bbff;
  --app-bg-color: #141414;
  --app-sidebar-color: #1e1e1e;
  --app-text-color: #e0e0e0;
  --app-border-color: #434343;
}

#app {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  max-width: 100%;
}

/* 确保router-view占满整个空间 */
#app > div,
.router-view-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  max-width: 100%;
  overflow: hidden;
}

/* Page transition animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.4s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-thumb {
  background-color: var(--app-border-color);
  border-radius: 3px;
}

::-webkit-scrollbar-track {
  background-color: transparent;
}

/* 确保Element Plus组件样式覆盖 */
.el-switch {
  --el-switch-on-color: var(--app-primary-color) !important;
}

.el-radio__input.is-checked .el-radio__inner {
  border-color: var(--app-primary-color) !important;
  background: var(--app-primary-color) !important;
}

.el-radio__input.is-checked+.el-radio__label {
  color: var(--app-primary-color) !important;
}

.el-button--primary {
  --el-button-bg-color: var(--app-primary-color) !important;
  --el-button-border-color: var(--app-primary-color) !important;
}

.el-button--primary:hover {
  --el-button-hover-bg-color: var(--app-secondary-color) !important;
  --el-button-hover-border-color: var(--app-secondary-color) !important;
}

/* 强制按钮可点击性 */
button, 
.el-button,
.el-radio,
.el-switch,
.el-checkbox {
  cursor: pointer !important;
  pointer-events: auto !important;
}

/* 确保布局填充整个窗口 */
.layout {
  width: 100% !important;
  height: 100% !important;
  display: flex !important;
  flex-direction: row !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
}

.sidebar {
  flex-shrink: 0 !important;
  z-index: 10 !important;
  box-sizing: border-box !important;
}

.main {
  flex: 1 !important;
  width: auto !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
}

.content {
  flex: 1 !important;
  overflow-y: auto !important;
  width: 100% !important;
  max-width: 100% !important;
  padding: 0 !important;
  display: flex !important;
  box-sizing: border-box !important;
}

.content > * {
  flex: 1 !important;
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

/* 确保所有元素都能正确等比缩放 */
img {
  max-width: 100%;
  height: auto;
}

/* 修复可能的溢出问题 */
.el-table {
  width: 100% !important;
  table-layout: fixed !important;
}

.el-table__body-wrapper {
  overflow-x: auto !important;
}

.el-table .cell {
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

/* 修复按钮和控件在小屏幕上的显示问题 */
.el-button {
  padding: 7px 14px !important;
  font-size: 14px !important;
  border-radius: 4px !important;
}

.el-button.is-circle {
  padding: 7px !important;
  height: auto !important;
  width: auto !important;
  min-width: 32px !important;
  min-height: 32px !important;
}

.el-button--small {
  padding: 5px 10px !important;
  font-size: 12px !important;
}

.el-button--small.is-circle {
  padding: 5px !important;
  min-width: 28px !important;
  min-height: 28px !important;
}

.el-button--large {
  padding: 10px 18px !important;
  font-size: 16px !important;
}

.el-button--large.is-circle {
  padding: 10px !important;
  min-width: 40px !important;
  min-height: 40px !important;
}

/* 确保滑块正确显示 */
.el-slider {
  --el-slider-height: 4px !important;
  margin: 10px 0 !important;
}

.el-slider__button {
  width: 12px !important;
  height: 12px !important;
}

.el-slider__runway {
  height: 4px !important;
}

@media (max-width: 768px) {
  .el-button {
    padding: 5px 10px !important;
    font-size: 13px !important;
  }
  
  .el-button.is-circle {
    padding: 5px !important;
    min-width: 28px !important;
    min-height: 28px !important;
  }
  
  .el-button--small {
    padding: 3px 8px !important;
    font-size: 12px !important;
  }
  
  .el-button--small.is-circle {
    padding: 3px !important;
    min-width: 24px !important;
    min-height: 24px !important;
  }
  
  .el-button--large {
    padding: 8px 14px !important;
    font-size: 14px !important;
  }
  
  .el-button--large.is-circle {
    padding: 8px !important;
    min-width: 36px !important;
    min-height: 36px !important;
  }
  
  .el-slider__button {
    width: 10px !important;
    height: 10px !important;
  }
}
</style>
