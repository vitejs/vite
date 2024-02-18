// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { foo } from './child'

import.meta.hot?.accept('./child', ({ foo }) => {
  log('(optional-chaining) child update')
  globalThis.__HMR__['.optional-chaining'] = foo
})
