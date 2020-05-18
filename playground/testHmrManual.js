import { hot } from 'vite/hmr'

export const foo = 1

if (__DEV__) {
  hot.accept(({ foo }) => {
    console.log('(self-accepting)1.foo is now:', foo)
  })

  hot.accept(({ foo }) => {
    console.log('(self-accepting)2.foo is now:', foo)
  })

  hot.dispose(() => {
    console.log('foo was: ', foo)
  })
}
