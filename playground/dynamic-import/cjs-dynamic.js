function text(el, text) {
  document.querySelector(el).textContent = text
}

import('@vitejs/test-dynamic-import-dep-cjs-plain-object').then((ns) => {
  if (typeof ns.hello === 'function' && ns.default.hello === ns.hello) {
    text('.cjs-dynamic-plain-object', 'ok')
  }
})

import('@vitejs/test-dynamic-import-dep-cjs-umd').then((ns) => {
  if (typeof ns.default === 'function') {
    text('.cjs-dynamic-umd', 'ok')
  }
})

import('@vitejs/test-dynamic-import-dep-cjs-compiled-from-esm').then((ns) => {
  if (typeof ns.default.default === 'function') {
    text('.cjs-dynamic-dep-cjs-compiled-from-esm', 'ok')
  }
})

import('@vitejs/test-dynamic-import-dep-cjs-compiled-from-cjs').then((ns) => {
  if (
    typeof ns.default === 'function' &&
    typeof ns !== 'function' &&
    ns.bar === 'bar'
  ) {
    text('.cjs-dynamic-dep-cjs-compiled-from-cjs', 'ok')
  }
})

import('@vitejs/test-dynamic-import-dep-cjs-with-es-module-flag').then((ns) => {
  text('.cjs-dynamic-dep-cjs-with-es-module-flag', ns.default.info)
})
