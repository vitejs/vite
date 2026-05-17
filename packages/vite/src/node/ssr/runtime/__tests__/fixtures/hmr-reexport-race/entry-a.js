import { createThing } from './shared.js'

export const result = createThing('a')

import.meta.hot?.accept()
