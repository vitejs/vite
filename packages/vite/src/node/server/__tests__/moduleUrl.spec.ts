import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { moduleUrlToBrowserUrl } from '../../../shared/utils'
import { normalizePath } from '../../utils'
import type { DevEnvironment } from '../environment'
import {
  browserUrlToModuleUrl,
  fileToModuleUrl,
  moduleUrlToFilePath,
  resolvedIdToModuleUrl,
} from '../moduleUrl'

describe('ModuleURL and BrowserURL conversions', () => {
  const root = normalizePath(path.resolve('/project'))
  const environment = {
    config: { root },
    depsOptimizer: {
      isOptimizedDepFile: (id: string) => id.includes('/.vite/deps/'),
    },
  } as DevEnvironment

  it('maps normalized file paths to root-relative or filesystem URLs', () => {
    const cases = [
      { input: root, output: '/' },
      { input: `${root}/.hidden.js`, output: '/.hidden.js' },
      { input: `${root}/src/file.js?raw`, output: '/src/file.js?raw' },
      {
        input: `${root}-sibling/file.js`,
        output: path.posix.join('/@fs/', `${root}-sibling/file.js`),
      },
      { input: 'C:/outside/file.js', output: '/@fs/C:/outside/file.js' },
      { input: 'C:/src/file.js', inputRoot: 'C:/', output: '/src/file.js' },
      { input: '/src/file.js', inputRoot: '/', output: '/src/file.js' },
    ]

    for (const { input, inputRoot = root, output } of cases) {
      expect(fileToModuleUrl(input, inputRoot)).toBe(output)
    }
  })

  it('recovers file paths from root-relative and filesystem ModuleURLs', () => {
    const files = [
      root,
      `${root}/.hidden.js`,
      `${root}/src/a%25 b-あ.js`,
      `${root}/src/file?#.js`,
      `${root}-sibling/file.js`,
    ]
    for (const file of files) {
      expect(moduleUrlToFilePath(fileToModuleUrl(file, root), root)).toBe(file)
    }
    expect(moduleUrlToFilePath('/@fs/C:/outside/file.js', root)).toBe(
      'C:/outside/file.js',
    )
    expect(moduleUrlToFilePath('/src/file.js', '/')).toBe(
      normalizePath(path.resolve('/src/file.js')),
    )
  })

  it('keeps multiple leading slashes relative to root', () => {
    expect(moduleUrlToFilePath('//src/file.js', root)).toBe(
      `${root}/src/file.js`,
    )
  })

  for (const [moduleUrl, browserPath] of [
    [
      '/src/a%25 b-あ.js?raw&plugin=a%2Fb',
      '/src/a%25 b-あ.js?raw&plugin=a%2Fb',
    ],
    [
      '\0virtual:demo?direct&index=0.css',
      '/@id/__x00__virtual:demo?direct&index=0.css',
    ],
    ['virtual:demo?v=old&worker', '/@id/virtual:demo?v=old&worker'],
    ['/@fs/C:/outside/file.js?url', '/@fs/C:/outside/file.js?url'],
  ]) {
    it(`preserves ModuleURL through BrowserURL transport: ${moduleUrl}`, () => {
      expect(moduleUrlToBrowserUrl(moduleUrl, '')).toBe(browserPath)
      const browserUrl = moduleUrlToBrowserUrl(moduleUrl, '/base/')
      expect(browserUrl).toBe('/base' + browserPath)
      expect(browserUrlToModuleUrl(browserUrl, '/base/')).toBe(moduleUrl)
    })
  }

  for (const [id, expected] of [
    [`${root}/src/main.js?raw`, '/src/main.js?raw'],
    ['\0virtual:demo?query', '\0virtual:demo?query'],
    ['virtual:demo', 'virtual:demo'],
    ['/@react-refresh', '/@react-refresh'],
    ['/slash-prefixed-virtual.js', '/slash-prefixed-virtual.js'],
  ]) {
    it(`maps resolved ID ${id} to ModuleURL ${expected}`, () => {
      expect(resolvedIdToModuleUrl(environment, id)).toBe(expected)
    })
  }

  it('maps files under a drive root to root-relative ModuleURLs', () => {
    const driveEnvironment = { config: { root: 'C:/' } } as DevEnvironment
    expect(resolvedIdToModuleUrl(driveEnvironment, 'C:/src/file.js')).toBe(
      '/src/file.js',
    )
  })

  it('maps existing out-of-root files and not-yet-written optimized files', () => {
    const file = normalizePath(fileURLToPath(import.meta.url))
    const optimized = normalizePath(path.resolve('/outside/.vite/deps/dep.js'))
    for (const id of [file + '?raw', optimized + '?v=abc']) {
      expect(resolvedIdToModuleUrl(environment, id)).toBe(
        path.posix.join('/@fs/', id),
      )
    }
  })
})
