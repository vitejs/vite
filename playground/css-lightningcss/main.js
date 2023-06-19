import './minify.css'
import './imported.css'
import mod from './mod.module.css'

document.querySelector('.modules').classList.add(mod['apply-color'])
text('.modules-code', JSON.stringify(mod, null, 2))

import composesPathResolvingMod from './composes-path-resolving.module.css'
document
  .querySelector('.path-resolved-modules-css')
  .classList.add(...composesPathResolvingMod['path-resolving-css'].split(' '))
text(
  '.path-resolved-modules-code',
  JSON.stringify(composesPathResolvingMod, null, 2),
)

import inlineMod from './inline.module.css?inline'
text('.modules-inline', inlineMod)

function text(el, text) {
  document.querySelector(el).textContent = text
}

if (import.meta.hot) {
  import.meta.hot.accept('./mod.module.css', (newMod) => {
    const list = document.querySelector('.modules').classList
    list.remove(mod.applyColor)
    list.add(newMod.applyColor)
    text('.modules-code', JSON.stringify(newMod.default, null, 2))
  })
}
