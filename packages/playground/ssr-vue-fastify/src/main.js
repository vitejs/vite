import { getCurrentInstance } from 'vue'
import base from './base.vue'
import { createSSRApp } from 'vue'
import { createRouter } from './router'

// SSR requires a fresh app instance per request, therefore we export a function
// that creates a fresh app instance. If using Vuex, we'd also be creating a
// fresh store here.
export function createApp (req) {
  const app = createSSRApp(base)
  const ctx = { req }
  const router = createRouter()
  app.use(router)
  return { ctx, app, router }
}

export function getSSRData () {
  return getCurrentInstance().appContext.app.config.globalProperties.$ssrData
}
