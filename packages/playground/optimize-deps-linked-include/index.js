export { msg } from './foo.js'

import { useState } from 'react'

export function useCount() {
  return useState(0)
}

// test dep with css/asset imports
import './test.css'

// test importing node built-ins
import fs from 'fs'

if (false) {
  fs.readFileSync()
} else {
  console.log('ok')
}
