import { value as _value } from './mod-a'

// Should error as `_value` is not defined yet within the circular imports
let __value
try {
  __value = `${_value} (unexpected no error)`
} catch {
  __value = 'mod-a (expected error)'
}

export const value = `mod-c -> ${__value}`
