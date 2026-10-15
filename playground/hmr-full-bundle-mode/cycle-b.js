import './cycle-a.js'

import.meta.hot?.accept('./cycle-a.js', () => {
  import.meta.hot.invalidate()
})
