// `injectedMsg` is not defined here. injectImportIntoOptimizedDep() in
// vite.config.js injects its import into the optimized output of this dep.
export function getInjectedMsg() {
  return injectedMsg
}
