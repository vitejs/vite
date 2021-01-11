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

function text(el, text) {
  document.querySelector(el).textContent = text
}
