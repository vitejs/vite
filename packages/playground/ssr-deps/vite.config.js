/**
 * @type {import('vite').UserConfig}
 */
module.exports = {
  resolve: {
    // The dependency `node-addon` needs to be linked to node_modules and preserve symlinks,
    // because the `.node` file cannot be unlinked in Windows after being filed to node_modules
    // ref: https://github.com/nodejs/node/issues/24878/
    preserveSymlinks: true
  }
}
