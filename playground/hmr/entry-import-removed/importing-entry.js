import './imported-entry.js'

document.querySelector('.entry-import-removed-importing').textContent =
  'importing entry'

if (import.meta.hot) {
  import.meta.hot.accept()
}
