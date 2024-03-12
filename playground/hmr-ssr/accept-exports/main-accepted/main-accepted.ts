import def, { a } from './target'
import { x } from './callback'

// we don't want to pollute other checks' logs...
if (0 > 1) log(x)

log(`>>>>>> ${a} ${def}`)
