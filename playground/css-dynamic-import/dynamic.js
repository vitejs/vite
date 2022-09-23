import './dynamic.css'

export const lazyLoad = async () => {
  await import('./static.js')
  document.body.classList.add('loaded')
}
