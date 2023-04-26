import './insert' // inserts "color: orange"
import './base.css' // includes "color: blue"

document.querySelector('.order-bulk-update').addEventListener('click', () => {
  import('./dynamic.css') // includes "color: green"
})
