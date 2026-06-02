import './parent'

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    import.meta.hot.invalidate()
  })
}

export const value = 'child'
