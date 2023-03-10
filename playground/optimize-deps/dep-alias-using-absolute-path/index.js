// Importing a shared dependency used by other modules,
// so dependency optimizer creates a common chunk.
// This is used to setup a test scenario, where dep scanner
// could not determine all of the used dependencies on first
// pass, e.g., a dependency that is aliased using an absolute
// path, in which case it used to trigger unnecessary "full
// reloads" invalidating all modules in a module graph.
const cloneDeep = require('lodash/cloneDeep')

// no-op, using imported module for sake of completeness
module.exports = cloneDeep({
  message: 'From dep-alias-using-absolute-path',
}).message
