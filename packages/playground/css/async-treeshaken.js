import './async-treeshaken.css'

const div = document.createElement('div')
div.className = 'async-treeshaken'
div.textContent =
  'async treeshaken chunk (this should be plum and should not show up in prod)'
document.body.appendChild(div)
