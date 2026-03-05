if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    document.querySelector('.prune').textContent += '|dep3-disposed'
  })
  import.meta.hot.prune(() => {
    document.querySelector('.prune').textContent += '|dep3-pruned'
  })
}
