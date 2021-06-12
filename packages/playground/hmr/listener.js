import { viteEventTarget } from '/@vite/client'

viteEventTarget.addEventListener('vite:connected', (event) => {
  console.log(`>>> vite:connected -- ${event.detail.type}`)
})
viteEventTarget.addEventListener('vite:update', (event) => {
  console.log(`>>> vite:update -- ${event.detail.type}`)
})
viteEventTarget.addEventListener('vite:error', (event) => {
  console.log(`>>> vite:error -- ${event.detail.type}`)
})
