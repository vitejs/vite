// Test for multiline new URL(..., import.meta.url) expressions
// This is a separate file to ensure the regex filter in assetImportMetaUrlPlugin
// correctly detects and processes multiline expressions that span multiple lines.
// The bug was that the filter regex didn't include the 's' flag, so multiline
// expressions were not being processed by the plugin.

// Test multiline expression that should be bundled
const multilineUrl = new URL('./nested/asset.png', import.meta.url)

// Another multiline test with different formatting
const multilineUrl2 = new URL('./import-meta-url/img.png', import.meta.url)

// Test with extra spacing and newlines
const multilineUrl3 = new URL(
  './nested/fragment.svg',

  import.meta.url,
)

// Export for verification
export { multilineUrl, multilineUrl2, multilineUrl3 }
