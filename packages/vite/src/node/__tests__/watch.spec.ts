import { describe, expect, test } from 'vitest'
import { resolveChokidarOptions } from '../watch'

function getDefaultIgnored(root: string) {
  const { ignored } = resolveChokidarOptions(
    undefined,
    new Set(),
    false,
    `${root}/node_modules/.vite`,
    root,
  )
  return (ignored as Array<(filePath: string) => boolean>)[0]
}

describe('resolveChokidarOptions default ignored', () => {
  test('ignores default directories inside the project root', () => {
    const isIgnored = getDefaultIgnored('/work/app')
    expect(isIgnored('/work/app/.git/HEAD')).toBe(true)
    expect(isIgnored('/work/app/node_modules/pkg/index.js')).toBe(true)
    expect(isIgnored('/work/app/test-results/trace.zip')).toBe(true)
    expect(isIgnored('/work/app/src/main.js')).toBe(false)
  })

  test('does not apply default ignores to parent directories of the root', () => {
    const isIgnored = getDefaultIgnored('/work/.git/worktrees/app')
    expect(isIgnored('/work/.git/worktrees/app/src/main.js')).toBe(false)
    expect(isIgnored('/work/.git/worktrees/app/.git/HEAD')).toBe(true)
    expect(isIgnored('/work/.git/config')).toBe(true)
    expect(isIgnored('/work/node_modules/pkg/main.js')).toBe(true)
  })
})
