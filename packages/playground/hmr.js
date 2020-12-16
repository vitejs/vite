import './hmrDep.js'
import './style.css'

export const foo = 222233

if (import.meta.hot) {
  import.meta.hot.accept(({ foo }) => {
    console.log('(self-accepting)1.foo is now:', foo)
  })

  import.meta.hot.accept(({ foo }) => {
    console.log('(self-accepting)2.foo is now:', foo)
  })

  import.meta.hot.accept('./hmrDep', ({ foo }) => {
    console.log('(single dep) foo is now:', foo)
  })

  import.meta.hot.accept(['./hmrDep'], (modules) => {
    console.log('(multiple deps) foo is now:', modules[0].foo)
  })

  import.meta.hot.dispose(() => {
    console.log(`foo was:`, foo)
  })
}
