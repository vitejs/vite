import './dep1.js'

if (import.meta.hot) {
  import.meta.hot.accept(() => {})
}
