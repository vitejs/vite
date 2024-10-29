// this is written in ESM but the file extension implies this is evaluated as CJS.
// BUT this doesn't matter in practice as the `module` condition is not used in node.
// hence SSR should not load this file.
export default '[fail] should not load me'
