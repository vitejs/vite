import './b'

export const c = 'c'

function render(content) {
  document.querySelector('.issue-3303').textContent = content
}
render(c)

import.meta.hot?.accept((nextExports) => {
  render(nextExports.c)
})
