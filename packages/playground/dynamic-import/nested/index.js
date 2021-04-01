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

// data URLs (`blob:`)
const code1 = 'export const msg = "blob"'
const blob = new Blob([code1], { type: 'text/javascript;charset=UTF-8' })
// eslint-disable-next-line node/no-unsupported-features/node-builtins
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

function text(el, text) {
  document.querySelector(el).textContent = text
}
