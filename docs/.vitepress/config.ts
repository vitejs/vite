export default {
  // ... other config
  markdown: {
    lineNumbers: true,
    config: (md) => {
      // Custom markdown-it plugins can be added here to wrap code blocks
      // with aria-roledescription or other landmarks if necessary.
    }
  }
}