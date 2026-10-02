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
  const defaultIgnored = (ignored as Array<(filePath: string) => boolean>)[0]
  return defaultIgnored
}

describe('resolveChokidarOptions default ignored', () => {
  test('ignores .git, node_modules and test-results inside the root', () => {
    const isIgnored = getDefaultIgnored('/work/app')
    expect(isIgnored('/work/app/.git')).toBe(true)
    expect(isIgnored('/work/app/.git/HEAD')).toBe(true)
    expect(isIgnored('/work/app/node_modules/foo/index.js')).toBe(true)
    expect(isIgnored('/work/app/packages/a/node_modules/foo/index.js')).toBe(
      true,
    )
    expect(isIgnored('/work/app/test-results/trace.zip')).toBe(true)
    expect(isIgnored('/work/app/src/main.js')).toBe(false)
  })

  test('does not ignore files when the root itself is inside an ignored directory name', () => {
    const isIgnored = getDefaultIgnored('/work/.git/worktrees/app')
    expect(isIgnored('/work/.git/worktrees/app')).toBe(false)
    expect(isIgnored('/work/.git/worktrees/app/src/main.js')).toBe(false)
    expect(isIgnored('/work/.git/worktrees/app/.git/HEAD')).toBe(true)
    expect(
      isIgnored('/work/.git/worktrees/app/node_modules/foo/index.js'),
    ).toBe(true)

    const isIgnoredInNodeModules = getDefaultIgnored(
      '/work/node_modules/pkg/example',
    )
    expect(
      isIgnoredInNodeModules('/work/node_modules/pkg/example/main.js'),
    ).toBe(false)
    const isIgnoredInTestResults = getDefaultIgnored('/work/test-results/app')
    expect(isIgnoredInTestResults('/work/test-results/app/main.js')).toBe(false)
  })

  test('still matches the absolute path outside of the root', () => {
    const isIgnored = getDefaultIgnored('/work/.git/worktrees/app')
    expect(isIgnored('/work/.git/config')).toBe(true)
    expect(isIgnored('/work/.git/worktrees/other/main.js')).toBe(true)
    expect(isIgnored('/other/node_modules/foo/index.js')).toBe(true)
    expect(isIgnored('/other/src/main.js')).toBe(false)
  })
})
