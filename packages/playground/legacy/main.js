async function run() {
  const { fn } = await import('./async.js')
  fn()
}

run()
