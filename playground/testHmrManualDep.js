import { hot } from 'vite/hmr'

if (__DEV__) {
  hot.accept('./testHmrManual.js', ({ foo }) => {
    console.log('(single dep)foo is now:', foo)
  })

  hot.accept(['./testHmrManual.js'], (modules) => {
    console.log('(multiple deps)foo is now:', modules[0].foo)
  })
}
