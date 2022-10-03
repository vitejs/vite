import { partition } from 'lodash'

export const array = partition([1, 2, 3, 4], (n) => n % 2)
