const ids = {
  hello: async () => {
    await import(/* a comment */ './hello.js')
  },
  about: async () => {
    await import('./about.js') // lazy load
  },
}

for (const [id, loader] of Object.entries(ids)) {
  const loadButton = document.querySelector(`#${id} .load`)
  loadButton.addEventListener('click', async () => {
    await loader()
    loadButton.insertAdjacentHTML('afterend', '<output>loaded</output>')
  })
}
