import { hot } from '@hmr'

export const foo = 2

if (__DEV__) {
  hot.accept(({ foo }) => {
    console.log('foo is now: ', foo)
  })
}
