import { createRouter, createWebHistory } from 'vue-router'
import Page from './views/Page.vue'

const history = createWebHistory()

const router = createRouter({
  history: history,
  routes: [
    {
      path: '/',
      component: Page,
    },
  ],
})

export default router
