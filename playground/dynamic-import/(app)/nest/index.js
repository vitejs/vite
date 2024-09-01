const base = 'index'
import(`../${base}.js`).then((mod) => {
  document.querySelector(
    '.dynamic-import-with-vars-contains-parenthesis',
  ).textContent = mod.hello()
})
