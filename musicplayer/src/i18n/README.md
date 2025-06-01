# Multi-Language Support for Music Player

This directory contains the internationalization (i18n) setup for the Music Player application using Vue I18n.

## Structure

- `index.js` - Main i18n configuration file
- `locales/` - Directory containing language files
  - `en.js` - English translations
  - `zh.js` - Chinese translations
  - Add more language files as needed

## Usage

### In Vue Components

To use translations in your Vue components:

```vue
<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <!-- Basic usage -->
  <h1>{{ t('app.name') }}</h1>
  
  <!-- With parameters -->
  <p>{{ t('library.tracksFound', { count: 5 }) }}</p>
</template>
```

### Changing Language

The language can be changed using the `setLanguage` function:

```js
import { setLanguage } from '@/i18n'

// Change to Chinese
setLanguage('zh')

// Change to English
setLanguage('en')
```

### Adding a New Language

To add a new language:

1. Create a new file in the `locales` directory (e.g., `ja.js` for Japanese)
2. Copy the structure from an existing language file and translate the values
3. Import the new language file in `index.js` and add it to the `messages` object
4. Add the new language to the `getAvailableLanguages` function in `index.js`

Example:

```js
// In locales/ja.js
export default {
  app: {
    name: '音楽プレーヤー',
    // ... more translations
  }
}

// In index.js
import ja from './locales/ja.js'

// Add to messages
messages: {
  en,
  zh,
  ja
}

// Add to getAvailableLanguages
export function getAvailableLanguages() {
  return [
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' }
  ]
}
```

## Best Practices

1. Use nested keys for organization (e.g., `app.name`, `player.play`)
2. Keep translations concise and clear
3. Use parameters for dynamic content with `{paramName}` syntax
4. Always provide translations for all supported languages
5. Use the same keys across all language files 