import path from 'node:path'
import { expect, test } from 'vitest'
import { getRolldownDevRuntimeFiles } from '../../plugins/clientInjections'

// The runtime entry imports its helper file with a relative path. Catch a rolldown layout
// change here, instead of as a 404 in the browser.
test('serves every file the rolldown dev runtime imports', () => {
  const files = getRolldownDevRuntimeFiles()
  let checked = 0
  for (const [urlPath, source] of files) {
    for (const match of source.matchAll(/\bfrom\s*['"](\.\.?\/[^'"]+)['"]/g)) {
      const imported = path.posix.join(path.posix.dirname(urlPath), match[1])
      expect(files.has(imported), `${urlPath} imports ${match[1]}`).toBe(true)
      checked++
    }
  }
  expect(checked).toBeGreaterThan(0)
})
