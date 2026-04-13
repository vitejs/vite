'use strict'

// Minimal cloneDeep implementation for testing
function cloneDeep(value) {
  if (value == null || typeof value !== 'object') {
    return value
  }

  if (Array.isArray(value)) {
    return value.map(cloneDeep)
  }

  const cloned = {}
  for (const key in value) {
    if (Object.hasOwn(value, key)) {
      cloned[key] = cloneDeep(value[key])
    }
  }
  return cloned
}

module.exports = cloneDeep
