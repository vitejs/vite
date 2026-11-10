export const value = 1

if (import.meta.hot) {
  const data = import.meta.hot.data
  if ('fromExecution' in data) {
    console.log(`(hot data) value from execution: ${data.fromExecution}`)
    console.log(`(hot data) value from dispose: ${data.fromDispose}`)
  }
  data.fromExecution = value

  import.meta.hot.dispose((data) => {
    data.fromDispose = value
  })
  import.meta.hot.accept()
}
