import { hot } from 'vite/hmr'

export const foo = 1

if (__DEV__) {
  hot.dispose(() => {
    console.log(`(dep) foo was: ${foo}`)
  })
}
