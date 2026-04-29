export default {
  isMain: import.meta.main,
  url: import.meta.url,
  dirname: import.meta.dirname,
  filename: import.meta.filename,
  resolved: import.meta.resolve('../import-meta/vite.config.ts'),
  // prettier-ignore
  resolvedMultiline: import.meta
    .resolve('../import-meta/vite.config.ts'),
}
