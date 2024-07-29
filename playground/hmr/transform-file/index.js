import './dep.my-file-ext'

if (import.meta.hot) {
  import.meta.hot.accept()
  import.meta.hot.on('vite:afterUpdate', (event) => {
    console.log(`>>> vite:afterUpdate -- ${event.type}`)
  })

  import.meta.hot.on('vite:beforeUpdate', (event) => {
    console.log(`>>> vite:beforeUpdate -- ${event.type}`)
  })
}
