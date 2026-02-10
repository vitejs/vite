;(() => {
  const localeSwitcherSelector =
    '.VPNavBarTranslations a[href], .VPNavScreenTranslations a[href]'

  document.addEventListener('click', (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }

    const target = event.target
    if (!(target instanceof Element)) return

    const link = target.closest(localeSwitcherSelector)
    if (!link) return

    const url = new URL(link.href)
    if (
      url.protocol !== 'https:' ||
      url.hostname === window.location.hostname ||
      !url.hostname.endsWith('.vite.dev')
    ) {
      return
    }

    event.preventDefault()
    window.location.assign(url.href)
  })
})()
