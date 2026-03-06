// Test for multiline expressions
// This is a separate file to ensure the regex filter in assetImportMetaUrlPlugin
// correctly detects and processes multiline expressions that span multiple lines.
export const multilineUrl = new URL(
  './nested/asset.png',

  import.meta.url,
)
