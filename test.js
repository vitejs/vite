const {
  transformForSSR
} = require('./packages/vite/dist/node/server/ssrTransform')

;(async () => {
  const { code } = await transformForSSR(`
  import { createApp as _createApp } from 'vue'
  import App from './App.vue'

  export function createApp() {
    return _createApp(App)
  }
  `)

  console.log(code)
})()
