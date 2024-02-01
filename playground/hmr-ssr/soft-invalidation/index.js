import { foo } from './child'

// @ts-expect-error global
export const msg = `soft-invalidation/index.js is transformed ${__TRANSFORM_COUNT__} times. child is ${foo}`
