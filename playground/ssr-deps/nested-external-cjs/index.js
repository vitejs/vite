// Module with state, to check that it is properly externalized and
// not bundled in the optimized deps
let msg

module.exports = {
  setMessage(externalMsg) {
    msg = externalMsg
  },
  getMessage() {
    return msg
  },
}
