import { value as fromA } from './a.js'
import { value as fromB } from './b.js'
import * as b from './b.js'

export const result = { fromA, fromB, bKeys: Object.keys(b) }
