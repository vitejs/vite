// CSS `?url` imported from JS — mirrors Vite's `playground/css` "?url" case
// (main.js: `import urlCss from './url-imported.css?url'; appendLinkStylesheet(urlCss)`).
//
// With `?url`, the import returns a URL STRING pointing at the PROCESSED CSS file
// (NOT injected as a <style>, NOT the raw contents). So:
//   - `urlCss` must be a URL string (e.g. `/url.css?url` in dev), and
//   - injecting it as a <link rel="stylesheet" href={urlCss}> must apply the rule
//     (proving the URL actually resolves to the served, processed CSS), and
//   - fetch(urlCss) must return the processed CSS body (the strongest resolution check).
import urlCss from './url.css?url'

// Render the URL value so the spec can assert its shape.
document.querySelector('.url-value').textContent = urlCss

// Inject the URL as a stylesheet <link> — mirrors Vite's appendLinkStylesheet(urlCss).
// If `urlCss` is a dangling/placeholder URL this <link> would 404 and `.url-imported-css`
// would NOT become yellow.
function appendLinkStylesheet(href) {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}
appendLinkStylesheet(urlCss)

// Also fetch the URL and render the served CSS body, so the spec can assert the URL
// resolves to the real processed CSS (this is what would catch a __ROLLDOWN_ASSET__
// placeholder or a 404).
async function renderFetched(href) {
  try {
    const res = await fetch(href)
    const body = res.ok ? await res.text() : `FETCH_FAILED ${res.status}`
    document.querySelector('.url-fetched').textContent = body
  } catch (e) {
    document.querySelector('.url-fetched').textContent = `FETCH_THREW ${e}`
  }
}
renderFetched(urlCss)

document.querySelector('.app').textContent = 'css-url loaded'

// Re-render whenever the `?url` module re-evaluates (HMR). Mirrors how a real consumer
// would react to the URL/content changing.
if (import.meta.hot) {
  import.meta.hot.accept('./url.css?url', (mod) => {
    if (mod) {
      document.querySelector('.url-value').textContent = mod.default
      renderFetched(mod.default)
    }
  })
}
