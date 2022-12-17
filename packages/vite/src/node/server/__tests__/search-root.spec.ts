import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { searchForWorkspaceRoot } from '../searchRoot'

const __dirname = dirname(fileURLToPath(import.meta.url))

describe('searchForWorkspaceRoot', () => {
  test('lerna', () => {
    const resolved = searchForWorkspaceRoot(
      resolve(__dirname, 'fixtures/lerna/nested'),
    )
    expect(resolved).toBe(resolve(__dirname, 'fixtures/lerna'))
  })

  test('pnpm', () => {
    const resolved = searchForWorkspaceRoot(
      resolve(__dirname, 'fixtures/pnpm/nested'),
    )
    expect(resolved).toBe(resolve(__dirname, 'fixtures/pnpm'))
  })

  test('yarn', () => {
    const resolved = searchForWorkspaceRoot(
      resolve(__dirname, 'fixtures/yarn/nested'),
    )
    expect(resolved).toBe(resolve(__dirname, 'fixtures/yarn'))
  })

  test('yarn at root', () => {
    const resolved = searchForWorkspaceRoot(resolve(__dirname, 'fixtures/yarn'))
    expect(resolved).toBe(resolve(__dirname, 'fixtures/yarn'))
  })

  test('none', () => {
    const resolved = searchForWorkspaceRoot(
      resolve(__dirname, 'fixtures/none/nested'),
    )
    // resolved to vite repo's root
    expect(resolved).toBe(resolve(__dirname, '../../../../../..'))
  })
})
