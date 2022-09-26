if (import.meta.hot) {
  // Need to accept, to register a callback for HMR
  import.meta.hot.accept(() => {
    // Trigger HMR in importers
    import.meta.hot.invalidate()
  })
}

export const value = 'child'
