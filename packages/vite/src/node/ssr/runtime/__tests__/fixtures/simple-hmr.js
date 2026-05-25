export const test = 'I am initialized'

globalThis.__HMR_PROMISE__ ??= Promise.withResolvers()

import.meta.hot?.accept()
