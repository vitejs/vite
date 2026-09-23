// test dynamic import to a cjs dep with __esModule flag from an importer
// explicitly marked as CJS (nearest package.json has "type": "commonjs").
// Node interop semantics apply: `default` is the whole `module.exports`
import('@vitejs/test-dep-cjs-compiled-from-esm').then((ns) => {
  const ok =
    typeof ns.default.default === 'function' && ns.default.default() === 'foo'
  document.querySelector('.cjs-dynamic-importer-cjs').textContent = ok
    ? 'ok'
    : 'fail'
})
