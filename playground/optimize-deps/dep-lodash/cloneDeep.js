'use strict'

// Minimal cloneDeep implementation for testing
module.exports = function cloneDeep(value) {
  if (value === null || typeof value !== 'object') {
    return value
  }

  if (Array.isArray(value)) {
    return value.map(cloneDeep)
  }

  const cloned = {}
  for (const key in value) {
    if (value.hasOwnProperty(key)) {
      cloned[key] = cloneDeep(value[key])
    }
  }
  return cloned
}
