import { createRouter, createWebHashHistory } from 'vue-router'
import Home from './src/components/Home.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  {
    path: '/about',
    name: 'About',
    component: () => import(/*breaks*/ './src/components/About.vue')
  } // Lazy load route component
]

export default createRouter({
  routes,
  history: createWebHashHistory()
})
