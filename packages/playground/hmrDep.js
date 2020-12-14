import './hmrNestedDep'

export const foo = 'from dep'

if (import.meta.hot) {
  const data = import.meta.hot.data
  if ('fromDispose' in data) {
    console.log(`(dep) foo from dispose: ${data.fromDispose}`)
  }

  import.meta.hot.dispose((data) => {
    console.log(`(dep) foo was: ${foo}`)
    data.fromDispose = foo * 1033
  })
}
