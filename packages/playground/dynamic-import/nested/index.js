async function setView(view) {
  const { msg } = await import(`../views/${view}.js`)
  text('.view', msg)
}

;['foo', 'bar'].forEach((id) => {
  document.querySelector(`.${id}`).addEventListener('click', () => setView(id))
})

document.querySelector('.baz').addEventListener('click', async () => {
  // literal dynamic
  const { msg } = await import('../views/baz.js')
  text('.view', msg)
})

function text(el, text) {
  document.querySelector(el).textContent = text
}
