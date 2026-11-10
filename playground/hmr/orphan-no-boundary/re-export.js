export * from './display.js'

if (import.meta.hot) {
  import.meta.hot.dispose(() =>
    console.log('[orphan-no-boundary] re-export.js disposed'),
  )
}
