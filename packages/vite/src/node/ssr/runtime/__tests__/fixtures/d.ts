/* eslint-disable no-console */

export { c as d } from './c'

import.meta.hot?.accept(() => {
  console.log('accept d')
})
