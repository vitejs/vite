// Test for multiline new URL(..., import.meta.url) expressions
// This is a separate file to ensure the regex filter in assetImportMetaUrlPlugin
// correctly detects and processes multiline expressions that span multiple lines.
// The bug was that the filter regex didn't include the 's' flag, so multiline
// expressions were not being processed by the plugin.

export const multilineUrl = new URL(
  './nested/fragment.svg',

  import.meta.url,
)
