// This file is used to test https://github.com/vitejs/vite/issues/20705
// The dev server should NOT serve this file when navigating to /test
export const message =
  'This is test.js - should not be served for /test navigation'
