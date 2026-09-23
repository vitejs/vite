// test dynamic import to a cjs dep with __esModule flag from an importer
// whose module format is ambiguous (nearest package.json has no "type" field).
// the __esModule flag should be respected: `default` is `module.exports.default`
import('@vitejs/test-dep-cjs-compiled-from-esm').then((ns) => {
  const ok = typeof ns.default === 'function' && ns.default() === 'foo'
  document.querySelector('.cjs-dynamic-importer-ambiguous').textContent = ok
    ? 'ok'
    : 'fail'
})
