export const value = 'dead-accept'
document.querySelector('.dead-accept').textContent = value

// visible to static analysis so the server ships a patch instead of
// broadcasting a full reload itself, but never executed at runtime
if (globalThis.__NEVER_TRUE__) {
  import.meta.hot?.accept(() => {})
}
