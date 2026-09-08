document.querySelector('.hmr-status').textContent = 'initial'

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log('[trusted-types] hot update accepted')
  })
}
