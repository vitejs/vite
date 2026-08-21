export const hotMsg = 'hot-v1'

globalThis.__bundled_dev_ssr_hot = hotMsg

if (import.meta.hot) {
  import.meta.hot.accept()
}
