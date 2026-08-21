exports.callItself = function () {
  return '[success]'
}

exports.callPeerDep = function () {
  try {
    // eslint-disable-next-line n/no-missing-require
    return require('foobar')
  } catch {
    return 'fallback'
  }
}
