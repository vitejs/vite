export function setupCounter(element) {
  let count = 0
  function increment() {
    element.textContent = `count is ${count}`
    count++
  }
  element.addEventListener('click', increment)
  increment()
}
