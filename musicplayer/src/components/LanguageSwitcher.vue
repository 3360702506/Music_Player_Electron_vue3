<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getAvailableLanguages, setLanguage } from '@/i18n'

const { t, locale } = useI18n()

const languages = getAvailableLanguages()
const currentLanguage = computed(() => locale.value)

const handleLanguageChange = (lang) => {
  setLanguage(lang)
}
</script>

<template>
  <div class="language-switcher">
    <el-dropdown trigger="click" @command="handleLanguageChange">
      <span class="language-dropdown-link">
        {{ languages.find(lang => lang.code === currentLanguage)?.name }}
        <el-icon class="el-icon--right"><arrow-down /></el-icon>
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item 
            v-for="lang in languages" 
            :key="lang.code" 
            :command="lang.code"
            :class="{ 'is-active': currentLanguage === lang.code }"
          >
            {{ lang.name }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<style scoped>
.language-switcher {
  display: inline-block;
}

.language-dropdown-link {
  cursor: pointer;
  display: flex;
  align-items: center;
  color: var(--el-text-color-primary);
}

.is-active {
  color: var(--el-color-primary);
  font-weight: bold;
}
</style> 