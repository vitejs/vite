export function setupCounter(element) {
  let counter = 0
  function increment() {
    element.textContent = `count is ${counter}`
    count++
  }
  element.addEventListener('click', increment)
  increment()
}
