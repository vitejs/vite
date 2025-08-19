// Test for multiline new URL(..., import.meta.url) expressions
// This is a separate file to ensure the regex filter in assetImportMetaUrlPlugin
// correctly detects and processes multiline expressions that span multiple lines.

export const multilineUrl = new URL(
  './nested/fragment.svg',

  import.meta.url,
)
