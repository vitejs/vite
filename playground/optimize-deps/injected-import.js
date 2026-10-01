import { getInjectedMsg } from '@vitejs/test-dep-with-injected-import'

try {
  document.querySelector('.injected-import-in-optimized-dep').textContent =
    getInjectedMsg()
} catch {
  // the import is only injected in dev where the dep optimizer runs
}
