// Test config that uses import.meta.resolve
export default {
  define: {
    IMPORT_META_URL: import.meta.url,
    IMPORT_META_RESOLVE_TEST: import.meta.resolve('./test-module'),
  },
}
