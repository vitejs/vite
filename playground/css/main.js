import './minify.css'
import './imported.css'
import './sugarss.sss'
import './sass.scss'
import './less.less'
import './stylus.styl'
import './manual-chunk.css'

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
  JSON.stringify(composesPathResolvingMod, null, 2),
)

import inlineMod from './inline.module.css?inline'
text('.modules-inline', inlineMod)

import charset from './charset.css?inline'
text('.charset-css', charset)

import './layered/index.css'

import './dep.css'
import './glob-dep.css'

// eslint-disable-next-line i/order
import { barModuleClasses } from '@vitejs/test-css-js-dep'
document
  .querySelector('.css-js-dep-module')
  .classList.add(barModuleClasses.cssJsDepModule)

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
const glob = import.meta.glob('./glob-import/*.css', { query: '?inline' })
Promise.all(
  Object.keys(glob).map((key) => glob[key]().then((i) => i.default)),
).then((res) => {
  text('.imported-css-glob', JSON.stringify(res, null, 2))
})

// globEager
const globEager = import.meta.glob('./glob-import/*.css', {
  eager: true,
  query: '?inline',
})
text('.imported-css-globEager', JSON.stringify(globEager, null, 2))

import postcssSourceInput from './postcss-source-input.css?inline&query=foo'
text('.postcss-source-input', postcssSourceInput)

// The file is jsfile.css.js, and we should be able to import it without extension
import jsFileMessage from './jsfile.css'
text('.jsfile-css-js', jsFileMessage)

import '#alias'
import aliasContent from '#alias?inline'
text('.aliased-content', aliasContent)
import aliasModule from '#alias-module'
document
  .querySelector('.aliased-module')
  .classList.add(aliasModule.aliasedModule)

import './unsupported.css'

import './async/index'

import('./same-name/sub1/sub')
import('./same-name/sub2/sub')
