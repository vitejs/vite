/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  resolve: {
    // linked dependency `node-addon` need to preserve symlinks as node_modules dependency
    // it cannot file to node_modules due to `.node` file cannot be unlink in Windows
    // ref: https://github.com/nodejs/node/issues/24878/
    preserveSymlinks: true
  }
}
