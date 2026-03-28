export default defineConfig({
  // ... other config
  themeConfig: {
    copyCodeButtonLabel: 'Copy Code',
    // ... other themeConfig
  },
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        copyCodeButtonLabel: 'Copy Code'
      }
    },
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      themeConfig: {
        copyCodeButtonLabel: '复制代码'
      }
    },
    ja: {
      label: '日本語',
      lang: 'ja',
      themeConfig: {
        copyCodeButtonLabel: 'コードをコピー'
      }
    }
  }
})