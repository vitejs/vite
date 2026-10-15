export const value = 'child'

import.meta.hot?.accept(() => {
  import.meta.hot.invalidate()
})
