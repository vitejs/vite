function covered$1() {
  return 'First'
}

function uncovered$1() {
  return 'Uncovered'
}

var first = /*#__PURE__*/ Object.freeze({
  __proto__: null,
  covered: covered$1,
  uncovered: uncovered$1,
})

function covered() {
  return 'Second'
}

function uncovered() {
  return 'Uncovered'
}

var second = /*#__PURE__*/ Object.freeze({
  __proto__: null,
  covered: covered,
  uncovered: uncovered,
})

export { first, second }
//# sourceMappingURL=bundle.js.map
