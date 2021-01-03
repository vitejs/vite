export { msg } from './foo.js'

import { useState } from 'react'

export function useCount() {
  return useState(0)
}
