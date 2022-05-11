const key = '$$excludedDependencyInstanceCount'

if (!(key in window)) {
  window[key] = 0
}

++window[key]

export function testExcluded() {
  return window[key]
}
