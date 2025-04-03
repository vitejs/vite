import 'vite/modulepreload-polyfill'
import cssUrl from '../styles/url.css?url'
import waterContainer from './water-container.svg'

const cssLink = document.createElement('link')
cssLink.rel = 'stylesheet'
cssLink.href = cssUrl
document.querySelector('head').prepend(cssLink)

const dummyMeta = document.createElement('meta')
dummyMeta.name = 'dummy'
dummyMeta.content = waterContainer
document.querySelector('head').append(dummyMeta)

export const colorClass = 'text-black'

export function colorHeading() {
  document.querySelector('h1').className = colorClass
}

colorHeading()

if (import.meta.hot) {
  import.meta.hot.accept()
}
