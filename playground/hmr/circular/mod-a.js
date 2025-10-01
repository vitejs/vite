export const value = 'mod-a'

import { value as _value } from './mod-b'

export const msg = `mod-a -> ${_value}`
