import { hot } from '@hmr'

export const foo = 1

if (__DEV__) {
  hot.accept(({ foo }) => {
    console.log('foo is now: ', foo)
  })

  hot.dispose(() => {
    console.log('foo was: ', foo)
  })
}
