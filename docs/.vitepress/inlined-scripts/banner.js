;(() => {
  const restore = (key, cls, def = false) => {
    const saved = localStorage.getItem(key)
    if (saved ? saved !== 'false' : def) {
      document.documentElement.classList.add(cls)
    }
  }

  window.__VITE_BANNER_ID__ = 'viteconf2025'
  restore(`vite-docs-banner-${__VITE_BANNER_ID__}`, 'banner-dismissed')
})()
