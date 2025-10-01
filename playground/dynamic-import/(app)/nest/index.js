const base = 'main'
import(`../${base}.js`).then((mod) => {
  document.querySelector(
    '.dynamic-import-with-vars-contains-parenthesis',
  ).textContent = mod.hello()
})
