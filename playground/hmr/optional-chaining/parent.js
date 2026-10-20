// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { foo } from './child'

const el = document.querySelector('.optional-chaining')
el.textContent = String(foo)

import.meta.hot?.accept('./child', ({ foo }) => {
  console.log('(optional-chaining) child update')
  el.textContent = String(foo)
})
