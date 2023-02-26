export function fn() {
  const m = new Map()
  m.set('foo', 'Hello')
  document.querySelector('#app').textContent = m.get('foo')
}
