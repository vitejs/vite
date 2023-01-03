document
  .querySelector('.dynamic-import-meta-url')
  .addEventListener('click', async () => {
    const { message } = await import(import.meta.url)
    document.querySelector('.dynamic-import-meta-url').textContent = message
  })

export const message = 'Success'
