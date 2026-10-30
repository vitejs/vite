const sorted = [3, 1, 2].toSorted()
const grouped = Object.groupBy(sorted, (n) => (n % 2 ? 'odd' : 'even'))
document.querySelector('#app').textContent =
  `sorted: ${sorted.join(',')}, odd: ${grouped.odd.join(',')}`
