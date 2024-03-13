const subUrl = new URL('./sub.js', import.meta.url)

export default () => import(subUrl)
