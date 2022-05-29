import mxdStatic from '../mxd'
import mxdStaticJSON from '../mxd.json'

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
const view = `/${arr[0]}`
document.querySelector('.qux').addEventListener('click', async () => {
  const { msg } = await import(/*@vite-ignore*/ view)
  text('.view', msg)
})

// mixed static and dynamic
document.querySelector('.mxd').addEventListener('click', async () => {
  const view = 'mxd'
  const { default: mxdDynamic } = await import(`../${view}.js`)
  text('.view', mxdStatic === mxdDynamic)
})

document.querySelector('.mxd2').addEventListener('click', async () => {
  const test = { jss: '../mxd.js' }
  const ttest = test
  const view = 'mxd'
  const { default: mxdDynamic } = await import(/*@vite-ignore*/ test.jss)
  text('.view', mxdStatic === mxdDynamic)
})

document.querySelector('.mxdjson').addEventListener('click', async () => {
  const view = 'mxd'
  const { default: mxdDynamicJSON } = await import(`../${view}.json`)
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
  code2
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

import(`../alias/${base}.js?raw`).then((mod) => {
  text('.dynamic-import-with-vars-raw', JSON.stringify(mod))
})

base = 'hi'
import(`@/${base}.js`).then((mod) => {
  text('.dynamic-import-with-vars-alias', mod.hi())
})

console.log('index.js')
