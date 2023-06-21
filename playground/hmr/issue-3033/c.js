import './b'

export const c = 'c'

function render(content) {
  document.querySelector('.issue-3033').textContent = content
}
render(c)

import.meta.hot?.accept((nextExports) => {
  render(nextExports.c)
})
