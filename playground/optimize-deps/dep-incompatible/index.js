const target = './sub.js'
const subUrl = new URL(target, import.meta.url)

export default () => import(subUrl)
