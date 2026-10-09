const importShared =
  await globalThis.__vite_ssr_hmr_evaluated_import_race__?.importShared?.()

export const sharedValue = importShared
  ? (await import('./shared.js')).value
  : undefined
export const evaluated = true
