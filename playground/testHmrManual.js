import { hot } from 'vite/hmr'
import './testHmrManualDep'

export const foo = 1

if (__DEV__) {
  hot.accept(({ foo }) => {
    console.log('(self-accepting)1.foo is now:', foo)
  })

  hot.accept(({ foo }) => {
    console.log('(self-accepting)2.foo is now:', foo)
  })

  hot.dispose(() => {
    console.log(`foo was: ${foo}`)
  })

  hot.accept('./testHmrManualDep.js', ({ foo }) => {
    console.log('(single dep) foo is now:', foo)
  })

  hot.accept(['./testHmrManualDep.js'], (modules) => {
    console.log('(multiple deps) foo is now:', modules[0].foo)
  })
}
