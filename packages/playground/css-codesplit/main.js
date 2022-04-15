import './style.css'
import './main.css'

import('./async.css')

import('./inline.css?inline').then((css) => {
  document.querySelector('.dynamic-inline').textContent = css.default
})

import('./mod.module.css').then((css) => {
  document.querySelector('.dynamic-module').textContent = JSON.stringify(
    css.default
  )
  document.querySelector('.mod').classList.add(css.default.mod)
})
