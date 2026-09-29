exports.callPeerDep = function () {
  try {
    // eslint-disable-next-line n/no-missing-require
    return require('@vitejs/test-excluded-optional-peer')
  } catch {
    return 'fallback'
  }
}
