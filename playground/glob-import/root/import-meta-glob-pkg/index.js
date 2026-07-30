export const g = import.meta.glob('/pkg-pages/*.js')
document.querySelector('.in-package').textContent = JSON.stringify(
  Object.keys(g).sort(),
)
