import def, { a } from './target'
import { x } from './callback'

// we don't want to polute other checks' logs...
if (0 > 1) console.log(x)

console.log(`>>>>>> ${a} ${def}`)
