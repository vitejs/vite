export default {
  isMain: import.meta.main,
  url: import.meta.url,
  dirname: import.meta.dirname,
  filename: import.meta.filename,
  // Test multi-line formatted import.meta.resolve (as Prettier might format it)
  resolved: import.meta.resolve('../import-meta-multiline/vite.config.ts'),
}
