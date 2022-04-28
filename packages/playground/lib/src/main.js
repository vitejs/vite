export default function myLib(sel) {
  // Force esbuild helpers
  console.log({ ...'foo' })

  document.querySelector(sel).textContent = 'It works'
}
