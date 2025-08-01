// Test config that uses import.meta.resolve with different cases
export default {
  define: {
    // Basic usage
    RESOLVED_MODULE: import.meta.resolve('./test-module'),
    // With explicit extension
    RESOLVED_WITH_EXT: import.meta.resolve('./test-module.js'),
    // URL context
    BASE_URL: import.meta.url,
  },
}
