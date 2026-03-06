export const foo = 'hello'
text('.hmr', foo)

import assetUrlImported from './asset.png'

export const assetUrl = assetUrlImported
text('.asset', assetUrl)

function text(el, text) {
  document.querySelector(el).textContent = text
}

import.meta.hot?.accept((mod) => {
  if (mod) {
    text('.hmr', mod.foo)
    text('.asset', mod.assetUrl)
  }
})
