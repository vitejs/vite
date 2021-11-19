import './style.css'
import './main.css'
import('./async.css?inline').then((css) => {
  const style = document.createElement('style')
  style.dataset.import = true
  style.textContent = css.default
  document.head.appendChild(style)
})

document.getElementById(
  'app'
).innerHTML = `<h1>This should be red</h1><h2>This should be blue</h2><h3>This should be yellow</h3>`
