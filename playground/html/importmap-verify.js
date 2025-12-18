// This script verifies that the importmap is present and correctly defined
// We can't actually use the importmap for imports in dev mode due to Vite's transformations,
// but we can verify it exists in the DOM
const importmapScript = document.querySelector('script[type="importmap"]')
if (importmapScript) {
  const importmap = JSON.parse(importmapScript.textContent)
  if (importmap.imports && importmap.imports['some-pkg']) {
    console.log('importmap is correctly defined')
    const testDiv = document.getElementById('importmap-test')
    if (testDiv) {
      testDiv.textContent = 'importmap present'
    }
  }
}
