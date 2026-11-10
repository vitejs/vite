// the webpack UMD wrapper, like `clipboard`
;(function webpackUniversalModuleDefinition(root, factory) {
  if (typeof exports === 'object' && typeof module === 'object')
    module.exports = factory()
  else if (typeof define === 'function' && define.amd) define([], factory)
  else if (typeof exports === 'object') exports['Umd'] = factory()
  else root['Umd'] = factory()
})(this, function () {
  return function Umd() {}
})
