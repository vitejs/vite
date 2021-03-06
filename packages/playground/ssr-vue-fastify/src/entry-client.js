import { createApp } from './main'

const { app, router } = createApp()

app.config.globalProperties.$ssrData = window.$ssrData

// wait until router is ready before mounting to ensure hydration match
router.isReady().then(() => {
  app.mount('#app')
})
