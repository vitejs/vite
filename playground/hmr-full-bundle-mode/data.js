// verifies `import.meta.hot.data` persists across HMR updates (#23001)
const data = import.meta.hot?.data ?? {}

// direct mutation: must survive each update, so `count` keeps climbing
data.count = (data.count ?? 0) + 1
text('.data-count', data.count)

// written by the dispose callback below: proves the disposer is handed the
// *existing* data object rather than a freshly allocated one
text('.data-disposed', data.disposed ?? 0)

if (import.meta.hot) {
  import.meta.hot.dispose((prev) => {
    prev.disposed = (prev.disposed ?? 0) + 1
  })
  import.meta.hot.accept()
}

// @hmr-bump

function text(el, value) {
  document.querySelector(el).textContent = String(value)
}
