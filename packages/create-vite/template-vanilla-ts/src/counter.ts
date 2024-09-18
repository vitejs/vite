export function setupCounter(element: HTMLButtonElement) {
  let count = 0
  function increment() {
    element.textContent = `count is ${count}`
    count++
  }
  element.addEventListener('click', increment)
  increment()
}
