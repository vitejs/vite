import { overlay } from './dialog.js'

await globalThis.__vite_ssr_concurrent_cycle__.wait('menu')

export const menu = 'menu'
export const readOverlay = () => overlay
