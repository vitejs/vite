import './minify.css'

import css from './imported.css'
text('.imported-css', css)

import sass from './sass.scss'
text('.imported-sass', sass)

import less from './less.less'
text('.imported-less', less)

import stylus from './stylus.styl'
text('.imported-stylus', stylus)

import rawCss from './raw-imported.css?raw'
text('.raw-imported-css', rawCss)

import mod from './mod.module.css'
document.querySelector('.modules').classList.add(mod['apply-color'])
text('.modules-code', JSON.stringify(mod, null, 2))

import sassMod from './mod.module.scss'
document.querySelector('.modules-sass').classList.add(sassMod['apply-color'])
text('.modules-sass-code', JSON.stringify(sassMod, null, 2))

import composesPathResolvingMod from './composes-path-resolving.module.css'
document
  .querySelector('.path-resolved-modules-css')
  .classList.add(...composesPathResolvingMod['path-resolving-css'].split(' '))
document
  .querySelector('.path-resolved-modules-sass')
  .classList.add(...composesPathResolvingMod['path-resolving-sass'].split(' '))
document
  .querySelector('.path-resolved-modules-less')
  .classList.add(...composesPathResolvingMod['path-resolving-less'].split(' '))
text(
  '.path-resolved-modules-code',
  JSON.stringify(composesPathResolvingMod, null, 2)
)

import inlineMod from './inline.module.css?inline'
text('.modules-inline', inlineMod)

import charset from './charset.css'
text('.charset-css', charset)

import './dep.css'
import './glob-dep.css'

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

  import.meta.hot.accept('./mod.module.scss', (newMod) => {
    const list = document.querySelector('.modules-sass').classList
    list.remove(mod.applyColor)
    list.add(newMod.applyColor)
    text('.modules-sass-code', JSON.stringify(newMod.default, null, 2))
  })
}

// async
import('./async')

if (import.meta.env.DEV) {
  import('./async-treeshaken')
}

// inlined
import inlined from './inlined.css?inline'
text('.inlined-code', inlined)

// glob
const glob = import.meta.glob('./glob-import/*.css')
Promise.all(
  Object.keys(glob).map((key) => glob[key]().then((i) => i.default))
).then((res) => {
  text('.imported-css-glob', JSON.stringify(res, null, 2))
})

// globEager
const globEager = import.meta.glob('./glob-import/*.css', { eager: true })
text('.imported-css-globEager', JSON.stringify(globEager, null, 2))

import postcssSourceInput from './postcss-source-input.css?query=foo'
text('.postcss-source-input', postcssSourceInput)
