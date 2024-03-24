;(async () => {
  const { publish } = await import('@vitejs/release-scripts')

  // pnpm 7.14.1 doesn't support this
  const provenance = false

  publish({ defaultPackage: 'vite', provenance, packageManager: 'pnpm' })
})()
