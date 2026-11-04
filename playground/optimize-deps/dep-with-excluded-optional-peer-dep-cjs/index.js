exports.callPeerDep = function () {
  try {
    // This should not be hoisted as static import
    // eslint-disable-next-line n/no-missing-require
    return require('@vitejs/test-excluded-optional-peer')
  } catch {
    return 'fallback'
  }
}
