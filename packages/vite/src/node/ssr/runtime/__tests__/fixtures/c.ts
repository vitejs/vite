 

export { a as c } from './a'

import.meta.hot?.accept(() => {
  console.log('accept c')
})
