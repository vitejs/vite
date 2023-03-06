// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { foo } from './child'

import.meta.hot?.accept('./child', ({ foo }) => {
  console.log('(optional-chaining) child update')
  document.querySelector('.optional-chaining').textContent = foo
})
