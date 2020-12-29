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

  import.meta.hot.on('foo', ({ msg }) => {
    text('.custom', msg)
  })
}

function text(el, text) {
  document.querySelector(el).textContent = text
}
