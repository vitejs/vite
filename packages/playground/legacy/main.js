async function run() {
  const { fn } = await import('./async.js')
  fn()
}

run()

document.getElementById('env').textContent = `is legacy: ${
  import.meta.env.LEGACY
}`
