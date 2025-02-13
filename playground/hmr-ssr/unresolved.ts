export const foo = 1
hmr('.app', foo)

if (import.meta.hot) {
  import.meta.hot.accept(({ foo }) => {
    log('(self-accepting 1) foo is now:', foo)
  })

  import.meta.hot.accept(({ foo }) => {
    log('(self-accepting 2) foo is now:', foo)
  })

  import.meta.hot.dispose(() => {
    log(`foo was:`, foo)
  })
}

function hmr(key: string, value: unknown) {
  ;(globalThis.__HMR__ as any)[key] = String(value)
}
