import VueApp from './App.vue'
import { createSSRApp } from 'vue'

export function createVueApp() {
  return createSSRApp(VueApp)
}
