import { createApp } from 'vue'
// @ts-ignore
import { CompA } from '../dist/lib/my-vue-lib.mjs'
import '../dist/lib/assets1.style.css'

const app = createApp(CompA)
app.mount('#app')
