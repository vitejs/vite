// Three lazy "routes" that all statically import shared.js. Each button starts
// its import right away and never waits for the others, so a spec can hold
// A's response in the browser while B is requested and evaluated.
// A failed import is written to the DOM so the spec can read the error.
function load(name, importer) {
  document.getElementById(`${name}-btn`).addEventListener('click', () => {
    importer().then(
      (mod) => {
        document.getElementById(`${name}-content`).textContent = mod.value
      },
      (err) => {
        document.getElementById(`${name}-content`).textContent =
          `error:${err.message}`
      },
    )
  })
}

load('route-a', () => import('./page-a.js'))
load('route-b', () => import('./page-b.js'))
load('route-c', () => import('./page-c.js'))
