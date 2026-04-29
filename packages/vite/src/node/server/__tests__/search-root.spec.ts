import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'
import { searchForWorkspaceRoot } from '../searchRoot'

const dirname = import.meta.dirname

describe('searchForWorkspaceRoot', () => {
  test('lerna', () => {
    const resolved = searchForWorkspaceRoot(
      resolve(dirname, 'fixtures/lerna/nested'),
    )
    expect(resolved).toBe(resolve(dirname, 'fixtures/lerna'))
  })

  test('pnpm', () => {
    const resolved = searchForWorkspaceRoot(
      resolve(dirname, 'fixtures/pnpm/nested'),
    )
    expect(resolved).toBe(resolve(dirname, 'fixtures/pnpm'))
  })

  test('yarn', () => {
    const resolved = searchForWorkspaceRoot(
      resolve(dirname, 'fixtures/yarn/nested'),
    )
    expect(resolved).toBe(resolve(dirname, 'fixtures/yarn'))
  })

  test('yarn at root', () => {
    const resolved = searchForWorkspaceRoot(resolve(dirname, 'fixtures/yarn'))
    expect(resolved).toBe(resolve(dirname, 'fixtures/yarn'))
  })

  test('none', () => {
    const resolved = searchForWorkspaceRoot(
      resolve(dirname, 'fixtures/none/nested'),
    )
    // resolved to vite repo's root
    expect(resolved).toBe(resolve(dirname, '../../../../../..'))
  })
})
