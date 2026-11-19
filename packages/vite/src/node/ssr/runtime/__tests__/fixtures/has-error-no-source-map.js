import { runInThisContext } from 'node:vm'

runInThisContext(
  '(function inVm() { throw new Error("vm") })()\n//# sourceURL=renamed.js',
  { filename: 'original.js', displayErrors: false },
)
