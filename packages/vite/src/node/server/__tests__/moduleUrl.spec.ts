import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { moduleUrlToBrowserUrl } from '../../../shared/utils'
import { normalizePath } from '../../utils'
import { browserUrlToModuleUrl, fileToModuleUrl } from '../moduleUrl'

describe('ModuleURL and BrowserURL conversions', () => {
  const root = normalizePath(path.resolve('/project'))
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
})
