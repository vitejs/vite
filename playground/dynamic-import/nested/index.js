import mxdStatic from '../files/mxd'
import mxdStaticJSON from '../files/mxd.json'

async function setView(view) {
  const { msg } = await import(`../views/${view}.js`)
  text('.view', msg)
}

;['foo', 'bar'].forEach((id) => {
  document.querySelector(`.${id}`).addEventListener('click', () => setView(id))
})

// literal dynamic
document.querySelector('.baz').addEventListener('click', async () => {
  const { msg } = await import('../views/baz.js')
  text('.view', msg)
})

// full dynamic
const arr = ['qux.js']
const view = `/views/${arr[0]}`
document.querySelector('.qux').addEventListener('click', async () => {
  const { msg } = await import(/*@vite-ignore*/ view)
  text('.view', msg)
})

// mixed static and dynamic
document.querySelector('.mxd').addEventListener('click', async () => {
  const view = 'mxd'
  const { default: mxdDynamic } = await import(`../files/${view}.js`)
  text('.view', mxdStatic === mxdDynamic)
})

document.querySelector('.mxd2').addEventListener('click', async () => {
  const test = { jss: '../files/mxd.js' }
  const ttest = test
  const view = 'mxd'
  const { default: mxdDynamic } = await import(/*@vite-ignore*/ test.jss)
  text('.view', mxdStatic === mxdDynamic)
})

document.querySelector('.mxdjson').addEventListener('click', async () => {
  const view = 'mxd'
  const { default: mxdDynamicJSON } = await import(`../files/${view}.json`)
  text('.view', mxdStaticJSON === mxdDynamicJSON)
})

// data URLs (`blob:`)
const code1 = 'export const msg = "blob"'
const blob = new Blob([code1], { type: 'text/javascript;charset=UTF-8' })
const blobURL = URL.createObjectURL(blob)
document.querySelector('.issue-2658-1').addEventListener('click', async () => {
  const { msg } = await import(/*@vite-ignore*/ blobURL)
  text('.view', msg)
})

// data URLs (`data:`)
const code2 = 'export const msg = "data";'
const dataURL = `data:text/javascript;charset=utf-8,${encodeURIComponent(
  code2,
)}`
document.querySelector('.issue-2658-2').addEventListener('click', async () => {
  const { msg } = await import(/*@vite-ignore*/ dataURL)
  text('.view', msg)
})

document.querySelector('.css').addEventListener('click', async () => {
  await import('../css/index.css')
  text('.view', 'dynamic import css')
})

document.querySelector('.pkg-css').addEventListener('click', async () => {
  await import('./deps')
  text('.view', 'dynamic import css in package')
})

function text(el, text) {
  document.querySelector(el).textContent = text
}

let base = 'hello'

import(`../alias/${base}.js`).then((mod) => {
  text('.dynamic-import-with-vars', mod.hello())
})

import(/*@vite-ignore*/ `https://localhost`).catch((mod) => {
  console.log(mod)
  text('.dynamic-import-with-vars-ignored', 'hello')
})

import(/*@vite-ignore*/ `https://localhost//${'test'}`).catch((mod) => {
  console.log(mod)
  text('.dynamic-import-with-double-slash-ignored', 'hello')
})

// prettier-ignore
import(
  /* this messes with */
  `../alias/${base}.js`
  /* es-module-lexer */
).then((mod) => {
  text('.dynamic-import-with-vars-multiline', mod.hello())
})

import(`../alias/${base}.js?raw`).then((mod) => {
  text('.dynamic-import-with-vars-raw', JSON.stringify(mod))
})

base = 'url'
import(`../alias/${base}.js?url`).then((mod) => {
  text('.dynamic-import-with-vars-url', JSON.stringify(mod))
})

base = 'worker'
import(`../alias/${base}.js?worker`).then((workerMod) => {
  const worker = new workerMod.default()
  worker.postMessage('1')
  worker.addEventListener('message', (ev) => {
    console.log(ev)
    text('.dynamic-import-with-vars-worker', JSON.stringify(ev.data))
  })
})

base = 'hi'
import(`@/${base}.js`).then((mod) => {
  text('.dynamic-import-with-vars-alias', mod.hi())
})

base = 'self'
import(`../nested/${base}.js`).then((mod) => {
  text('.dynamic-import-self', mod.self)
})

import(`../nested/nested/${base}.js`).then((mod) => {
  text('.dynamic-import-nested-self', mod.self)
})

import(`../nested/static.js`).then((mod) => {
  text('.dynamic-import-static', mod.self)
})

console.log('index.js')
