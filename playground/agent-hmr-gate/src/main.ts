import { first } from './first'
import { second } from './second'

let currentFirst = first
let currentSecond = second

function render() {
  document.querySelector('#app')!.textContent =
    `${currentFirst}:${currentSecond}`
}

render()

if (import.meta.hot) {
  import.meta.hot.accept(
    ['./first', './second'],
    ([firstModule, secondModule]) => {
      if (firstModule) currentFirst = firstModule.first
      if (secondModule) currentSecond = secondModule.second
      render()
    },
  )
}
