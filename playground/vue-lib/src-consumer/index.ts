import { createApp } from 'vue'
// @ts-ignore
import { CompA } from '../dist/lib/my-vue-lib'
import '../dist/lib/style.css'

const app = createApp(CompA)
app.mount('#app')
