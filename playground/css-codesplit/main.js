import './style.css'
import './main.css'
import './order'

import './chunk.css'
import chunkCssUrl from './chunk.css?url'

// use this to not treeshake
globalThis.__test_chunkCssUrl = chunkCssUrl

import('./async.css')
import('./async-js')

import('./inline.css?inline').then((css) => {
  document.querySelector('.dynamic-inline').textContent = css.default
})

import('./mod.module.css').then((css) => {
  document.querySelector('.dynamic-module').textContent = JSON.stringify(
    css.default,
  )
  document.querySelector('.mod').classList.add(css.default.mod)
})
