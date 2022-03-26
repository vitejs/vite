import { foo as depFoo, nestedFoo } from './hmrDep'

export const foo = 1
text('.app', foo)
text('.dep', depFoo)
text('.nested', nestedFoo)

if (import.meta.hot) {
  import.meta.hot.accept(({ foo }) => {
    console.log('(self-accepting 1) foo is now:', foo)
  })

  import.meta.hot.accept(({ foo }) => {
    console.log('(self-accepting 2) foo is now:', foo)
  })

  const handleDep = (type, newFoo, newNestedFoo) => {
    console.log(`(${type}) foo is now: ${newFoo}`)
    console.log(`(${type}) nested foo is now: ${newNestedFoo}`)
    text('.dep', newFoo)
    text('.nested', newNestedFoo)
  }

  import.meta.hot.accept('./hmrDep', ({ foo, nestedFoo }) => {
    handleDep('single dep', foo, nestedFoo)
  })

  import.meta.hot.accept(['./hmrDep'], ([{ foo, nestedFoo }]) => {
    handleDep('multi deps', foo, nestedFoo)
  })

  import.meta.hot.dispose(() => {
    console.log(`foo was:`, foo)
  })

  import.meta.hot.on('vite:beforeUpdate', (event) => {
    console.log(`>>> vite:beforeUpdate -- ${event.type}`)

    const cssUpdate = event.updates.find(
      (update) =>
        update.type === 'css-update' && update.path.match('global.css')
    )
    if (cssUpdate) {
      const el = document.querySelector('#global-css') as HTMLLinkElement
      text('.css-prev', el.href)
      // We don't have a vite:afterUpdate event, but updates are currently sync
      setTimeout(() => {
        text('.css-post', el.href)
      }, 0)
    }
  })

  import.meta.hot.on('vite:error', (event) => {
    console.log(`>>> vite:error -- ${event.type}`)
  })

  import.meta.hot.on('custom:foo', ({ msg }) => {
    text('.custom', msg)
  })

  // send custom event to server to calculate 1 + 2
  import.meta.hot.send('custom:remote-add', { a: 1, b: 2 })
  import.meta.hot.on('custom:remote-add-result', ({ result }) => {
    text('.custom-communication', result)
  })
}

function text(el, text) {
  document.querySelector(el).textContent = text
}
