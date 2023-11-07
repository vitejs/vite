import './b'

export const c = 'c'

function render(content) {
  document.querySelector('.self-accept-within-circular').textContent = content
}
render(c)

import.meta.hot?.accept((nextExports) => {
  render(nextExports.c)
})
