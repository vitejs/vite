import './evaluated.js'

await globalThis.__vite_ssr_hmr_evaluated_import_race__?.wait?.()

export const value = 'ready'
