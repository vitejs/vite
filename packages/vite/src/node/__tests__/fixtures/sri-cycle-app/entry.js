// Entry statically imports a and b. The runtime preload cycle is injected by
// `modulePreload.resolveDependencies` in the test once `manualChunks` forces
// each module into a separate chunk.
import { value as aValue } from './a.js'
import { value as bValue } from './b.js'

console.log(aValue, bValue)
