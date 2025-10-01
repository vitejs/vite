import query1 from './multi-query?query1'
import query2 from './multi-query?query2'

hmr('query1', query1)
hmr('query2', query2)

function hmr(key, value) {
  globalThis.__HMR__[key] = String(value)
}
