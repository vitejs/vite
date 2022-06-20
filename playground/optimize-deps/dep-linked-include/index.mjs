export { msg } from './foo.js'

// test importing node built-ins
import fs from 'node:fs'

import { useState } from 'react'

export function useCount() {
  return useState(0)
}

// test dep with css/asset imports
import './test.css'

if (false) {
  fs.readFileSync()
} else {
  console.log('ok')
}

export { default as VueSFC } from './Test.vue'
