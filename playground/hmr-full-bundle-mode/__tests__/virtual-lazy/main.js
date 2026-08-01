import('virtual:lazy-me').then((m) => {
  document.querySelector('#app').textContent = m.default
})
