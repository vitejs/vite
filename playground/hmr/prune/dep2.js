if (import.meta.hot) {
  import.meta.hot.prune(() => {
    document.querySelector('.prune').textContent = 'prune/dep2-pruned'
  })
}
