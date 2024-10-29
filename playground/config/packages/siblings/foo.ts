import lodash from 'lodash'

export const array = lodash.partition([1, 2, 3, 4], (n) => n % 2)
