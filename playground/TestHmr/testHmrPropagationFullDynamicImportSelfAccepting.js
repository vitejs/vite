export let __text = 'qux loaded'

let domEl

export function render(_domEl) {
  domEl = _domEl
  domEl.innerHTML = __text
}

if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    newModule.render(domEl)
  })
}
