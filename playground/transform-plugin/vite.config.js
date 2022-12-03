const { resolve } = require('node:path')
const { normalizePath } = require('vite')

let transformCount = 1

const transformPlugin = {
  name: 'transform',
  transform(code, id) {
    if (id === normalizePath(resolve(__dirname, 'index.js'))) {
      // Ensure `index.js` is reevaluated if 'plugin-dep.js' is changed
      this.addWatchFile('./plugin-dep.js')

      return `
        // Inject TRANSFORM_COUNT
        let TRANSFORM_COUNT = ${transformCount++};

        ${code}
      `
    }
  },
}

module.exports = {
  plugins: [transformPlugin],
}
