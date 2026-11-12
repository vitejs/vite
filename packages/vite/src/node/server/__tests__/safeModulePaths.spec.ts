import { expect, test } from 'vitest'
import { SafeModulePaths } from '../safeModulePaths'

test('registers IDs with cleaned paths and preserves exact filesystem paths', () => {
  const safeModulePaths = new SafeModulePaths()

  safeModulePaths.addId('/foo/bar?raw')
  expect(Array.from(safeModulePaths)).toStrictEqual([
    '/foo/bar?raw',
    '/foo/bar',
  ])

  safeModulePaths.clear()
  safeModulePaths.add('/foo#dir/bar?literal')
  expect(Array.from(safeModulePaths)).toStrictEqual(['/foo#dir/bar?literal'])
})
