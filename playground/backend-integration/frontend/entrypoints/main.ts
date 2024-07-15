import 'vite/modulepreload-polyfill'
import cssUrl from '../styles/url.css?url'

const cssLink = document.createElement('link')
cssLink.rel = 'stylesheet'
cssLink.href = cssUrl
document.querySelector('head').prepend(cssLink)

export const colorClass = 'text-black'

export function colorHeading() {
  document.querySelector('h1').className = colorClass
}

colorHeading()

if (import.meta.hot) {
  import.meta.hot.accept()
}
