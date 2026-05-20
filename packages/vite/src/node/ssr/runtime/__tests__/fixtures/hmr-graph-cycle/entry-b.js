// Fresh consumer #2. Races entry-a so that by the time it reaches
// cachedRequest(t.js), entry-a's chain has already set t's mod.exports and
// is parked inside stall.js. With the buggy graph-only cycle detection,
// entry-b is handed the partial exports and `seen` resolves to undefined.
import { x } from './t.js'
export const seen = x
