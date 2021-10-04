/**
 * Typescript automatically compiles dynamic `import()` to `resolve()`
 * so this needs to be a raw JS file until `typescript@4.5.0` lands with
 * `module: "node12"` support.
 *
 * @param {string} fileUrl
 * @returns {any}
 */
module.exports = (fileUrl) => import(fileUrl);
