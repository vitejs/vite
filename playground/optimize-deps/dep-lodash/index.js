;(function () {
  var freeExports =
    typeof exports === 'object' && exports && !exports.nodeType && exports

  var freeModule =
    freeExports &&
    typeof module === 'object' &&
    module &&
    !module.nodeType &&
    module

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

  const lodash = {}
  lodash.cloneDeep = cloneDeep

  if (freeModule) {
    ;(freeModule.exports = lodash).lodash = lodash
    freeExports.lodash = lodash
  }
}).call(this)
