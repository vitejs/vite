export const foo = 1
export { foo as nestedFoo } from './hmrNestedDep'

if (import.meta.hot) {
  const data = import.meta.hot.data
  if ('fromDispose' in data) {
    console.log(`(dep) foo from dispose: ${data.fromDispose}`)
  }

  import.meta.hot.dispose((data) => {
    console.log(`(dep) foo was: ${foo}`)
    data.fromDispose = foo
  })
}
