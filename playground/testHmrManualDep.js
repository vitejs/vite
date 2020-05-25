export const foo = 1

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    console.log(`(dep) foo was: ${foo}`)
  })
}
