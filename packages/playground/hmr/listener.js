import { viteEventTarget } from '/@vite/client'

viteEventTarget.addEventListener('vite:connected', () => {
  console.log(`>>> vite:connected`)
})
viteEventTarget.addEventListener('vite:update', () => {
  console.log(`>>> vite:update`)
})
viteEventTarget.addEventListener('vite:error', () => {
  console.log(`>>> vite:error`)
})
