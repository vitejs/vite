import { searchForWorkspaceRoot } from '../searchRoot'
import { resolve } from 'path'
import expect from 'expect'

describe('searchForWorkspaceRoot', () => {
  it('pnpm', () => {
    const resolved = searchForWorkspaceRoot(
      resolve(__dirname, 'fixtures/pnpm/nested')
    )
    expect(resolved).toBe(resolve(__dirname, 'fixtures/pnpm'))
  })

  it('yarn', () => {
    const resolved = searchForWorkspaceRoot(
      resolve(__dirname, 'fixtures/yarn/nested')
    )
    expect(resolved).toBe(resolve(__dirname, 'fixtures/yarn'))
  })

  it('yarn at root', () => {
    const resolved = searchForWorkspaceRoot(resolve(__dirname, 'fixtures/yarn'))
    expect(resolved).toBe(resolve(__dirname, 'fixtures/yarn'))
  })

  it('none', () => {
    const resolved = searchForWorkspaceRoot(
      resolve(__dirname, 'fixtures/none/nested')
    )
    // resolved to vite repo's root
    expect(resolved).toBe(resolve(__dirname, '../../../../../..'))
  })
})
