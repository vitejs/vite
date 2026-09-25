import { expect, test } from 'vitest'
import { getRolldownDevRuntime } from '../../plugins/clientInjections'

// Only this one file is served, so an import in it would 404 in the browser.
test('the rolldown dev runtime imports nothing', () => {
  const source = getRolldownDevRuntime()
  expect(source).toContain('DevRuntime')
  expect(source).not.toMatch(/^\s*import\b/m)
  expect(source).not.toMatch(/\bfrom\s*['"]/)
})
