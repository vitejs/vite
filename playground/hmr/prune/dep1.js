import './dep2.js'

// TODO: https://github.com/vitejs/vite/issues/20781
// currently we need one more `import` in this module
// to trigger prune for depending module `dep2.js` since
// the prune event logic is skipped when `es-module-lexer`
// detects `imports.length === 0`
import './dep2-other.js'
