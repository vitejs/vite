function createObject() {
  return { created: Date.now() }
}

export default function myLib(sel) {
  // Force esbuild spread helpers (https://github.com/evanw/esbuild/issues/951)
  console.log({ ...'foo' })

  document.querySelector(sel).textContent = 'It works'

  // Env vars should not be replaced
  console.log(process.env.NODE_ENV)

  // make sure umd helper has been moved to the right position
  console.log(`amd function(){ "use strict"; }`)

  // Test pure annotation preservation for tree-shaking
  // This should preserve the pure annotation comment
  const result = /* #__PURE__ */ createObject()

  return result
}

// For triggering unhandled global esbuild helpers in previous regex-based implementation for injection
;(function () {})()?.foo
