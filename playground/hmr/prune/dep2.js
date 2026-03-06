if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    document.querySelector('.prune').textContent += '|dep2-disposed'
  })
  import.meta.hot.prune(() => {
    document.querySelector('.prune').textContent += '|dep2-pruned'
  })
}
