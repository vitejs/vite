import { searchForWorkspaceRoot } from '../searchRoot'
import { resolve } from 'path'

describe('searchForWorkspaceRoot', () => {
  test('pnpm', () => {
    const resolved = searchForWorkspaceRoot(
      resolve(__dirname, 'fixtures/pnpm/nested'),
      5
    )
    expect(resolved).toBe(resolve(__dirname, 'fixtures/pnpm'))
  })

  test('yarn', () => {
    const resolved = searchForWorkspaceRoot(
      resolve(__dirname, 'fixtures/yarn/nested'),
      5
    )
    expect(resolved).toBe(resolve(__dirname, 'fixtures/yarn'))
  })

  test('none', () => {
    const resolved = searchForWorkspaceRoot(
      resolve(__dirname, 'fixtures/none/nested'),
      3
    )
    expect(resolved).toBe(resolve(__dirname, 'fixtures/none/nested'))
  })

  test('deeper', () => {
    const resolved = searchForWorkspaceRoot(
      resolve(__dirname, 'fixtures/none/nested'),
      10
    )
    // resolved to vite repo's root
    expect(resolved).toBe(resolve(__dirname, '../../../../../..'))
  })
})
