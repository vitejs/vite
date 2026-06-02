exports.callItself = function () {
  return '[success]'
}

exports.callPeerDep = function () {
  try {
    return require('foobar')
  } catch {
    return 'fallback'
  }
}
