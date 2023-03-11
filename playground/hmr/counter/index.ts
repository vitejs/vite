const btn = document.querySelector('button')
let count = 0
const update = () => {
  btn.textContent = `Counter ${count}`
}
btn.onclick = () => {
  count++
  update()
}
function neverCalled() {
  import('./dep')
}
