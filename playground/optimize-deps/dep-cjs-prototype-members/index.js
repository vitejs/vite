// the exported object keeps its members on the prototype, not as own enumerable properties.
// The namespace import must preserve the prototype chain and copy own property descriptors.

// `Color` lives on the prototype, so it is only reachable if the namespace object
// keeps the prototype chain
const scope = Object.create({
  Color: (value) => value,
})

Object.defineProperty(scope, 'nonEnumerable', {
  value: 'non-enumerable',
  enumerable: false,
})

let liveCounter = 0
Object.defineProperty(scope, 'liveGetter', {
  get: () => ++liveCounter,
  enumerable: true,
})

module.exports = scope
