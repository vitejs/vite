import { beforeAll, describe, expect, test } from 'vitest'
import {
  browserLogs,
  editFile,
  expectWithRetry,
  getColor,
  isBuild,
  isServe,
  page,
  serverLogs,
  untilBrowserLogAfter,
  viteServer,
  viteTestUrl,
  withRetry,
} from '~utils'

function fetchHtml(p: string) {
  return fetch(viteTestUrl + p, {
    headers: { Accept: 'text/html,*/*' },
  })
}

function testPage(isNested: boolean) {
  test('pre transform', async () => {
    expect(await page.$('head meta[name=viewport]')).toBeTruthy()
  })

  test('string transform', async () => {
    expect(await page.textContent('h1')).toBe(
      isNested ? 'Nested' : 'Transformed',
    )
  })

  test('tags transform', async () => {
    const el = await page.$('head meta[name=description]')
    expect(await el.getAttribute('content')).toBe('a vite app')

    const kw = await page.$('head meta[name=keywords]')
    expect(await kw.getAttribute('content')).toBe('es modules')
  })

  test('combined transform', async () => {
    expect(await page.title()).toBe('Test HTML transforms')
    // the p should be injected to body
    expect(await page.textContent('body p.inject')).toBe('This is injected')
  })

  test('server only transform', async () => {
    if (!isBuild) {
      expect(await page.textContent('body p.server')).toMatch(
        'injected only during dev',
      )
    } else {
      expect(await page.innerHTML('body')).not.toMatch('p class="server"')
    }
  })

  test('build only transform', async () => {
    if (isBuild) {
      expect(await page.textContent('body p.build')).toMatch(
        'injected only during build',
      )
    } else {
      expect(await page.innerHTML('body')).not.toMatch('p class="build"')
    }
  })

  test('conditional transform', async () => {
    if (isNested) {
      expect(await page.textContent('body p.conditional')).toMatch(
        'injected only for /nested/',
      )
    } else {
      expect(await page.innerHTML('body')).not.toMatch('p class="conditional"')
    }
  })

  test('body prepend/append transform', async () => {
    expect(await page.innerHTML('body')).toMatch(
      /prepended to body(.*)appended to body/s,
    )
  })

  test('css', async () => {
    expect(await getColor('h1')).toBe(isNested ? 'red' : 'blue')
    expect(await getColor('p')).toBe('grey')
  })

  if (isNested) {
    test('relative path in html asset', async () => {
      expect(await page.textContent('.relative-js')).toMatch('hello')
      expect(await getColor('.relative-css')).toMatch('red')
    })
  }
}

describe('main', () => {
  testPage(false)

  test('preserve comments', async () => {
    const html = await page.innerHTML('body')
    expect(html).toMatch(`<!-- comment one -->`)
    expect(html).toMatch(`<!-- comment two -->`)
  })

  test('external paths works with vite-ignore attribute', async () => {
    expect(await page.textContent('.external-path')).toBe('works')
    expect(await page.getAttribute('.external-path', 'vite-ignore')).toBe(null)
    expect(await getColor('.external-path')).toBe('red')
    if (isServe) {
      expect(serverLogs).not.toEqual(
        expect.arrayContaining([
          expect.stringMatching('Failed to load url /external-path.js'),
        ]),
      )
    } else {
      expect(serverLogs).not.toEqual(
        expect.arrayContaining([
          expect.stringMatching(
            /"\/external-path\.js".*can't be bundled without type="module" attribute/,
          ),
        ]),
      )
    }
  })

  test.runIf(isBuild)(
    'external paths by rollupOptions.external works',
    async () => {
      expect(await page.textContent('.external-path-by-rollup-options')).toBe(
        'works',
      )
      expect(serverLogs).not.toEqual(
        expect.arrayContaining([expect.stringContaining('Could not load')]),
      )
    },
  )
})

describe('nested', () => {
  beforeAll(async () => {
    await page.goto(viteTestUrl + '/nested/')
  })

  testPage(true)
})

describe('nested w/ query', () => {
  beforeAll(async () => {
    await page.goto(viteTestUrl + '/nested/index.html?v=1')
  })

  testPage(true)
})

describe.runIf(isBuild)('build', () => {
  describe('scriptAsync', () => {
    beforeAll(async () => {
      await page.goto(viteTestUrl + '/scriptAsync.html')
    })

    test('script is async', async () => {
      expect(await page.$('head script[type=module][async]')).toBeTruthy()
      expect(await page.$('head script[type=module]:not([async])')).toBeNull()
    })
  })

  describe('scriptMixed', () => {
    beforeAll(async () => {
      await page.goto(viteTestUrl + '/scriptMixed.html')
    })

    test('script is mixed', async () => {
      expect(await page.$('head script[type=module][async]')).toBeNull()
      expect(await page.$('head script[type=module]:not([async])')).toBeTruthy()
    })
  })

  describe('zeroJS', () => {
    // Ensure that the modulePreload polyfill is discarded in this case

    beforeAll(async () => {
      await page.goto(viteTestUrl + '/zeroJS.html')
    })

    test('zeroJS', async () => {
      expect(await page.$('head script[type=module]')).toBeNull()
    })
  })

  describe('inline entry', () => {
    const _countTags = (selector) => page.$$eval(selector, (t) => t.length)
    const countScriptTags = _countTags.bind(this, 'script[type=module]')
    const countPreloadTags = _countTags.bind(this, 'link[rel=modulepreload]')

    test('is inlined', async () => {
      await page.goto(viteTestUrl + '/inline/shared-2.html?v=1')
      expect(await countScriptTags()).toBeGreaterThan(1)
      expect(await countPreloadTags()).toBe(0)
    })

    test('is not inlined', async () => {
      await page.goto(viteTestUrl + '/inline/unique.html?v=1')
      expect(await countScriptTags()).toBe(1)
      expect(await countPreloadTags()).toBeGreaterThan(0)
    })

    test('execution order when inlined', async () => {
      await page.goto(viteTestUrl + '/inline/shared-1.html?v=1')
      expect((await page.textContent('#output')).trim()).toBe(
        'dep1 common dep2 dep3 shared',
      )
      await page.goto(viteTestUrl + '/inline/shared-2.html?v=1')
      expect((await page.textContent('#output')).trim()).toBe(
        'dep1 common dep2 dep3 shared',
      )
    })

    test('execution order when not inlined', async () => {
      await page.goto(viteTestUrl + '/inline/unique.html?v=1')
      expect((await page.textContent('#output')).trim()).toBe(
        'dep1 common dep2 unique',
      )
    })
  })
})

describe('noHead', () => {
  beforeAll(async () => {
    await page.goto(viteTestUrl + '/noHead.html')
  })

  test('noHead tags injection', async () => {
    const el = await page.$('html meta[name=description]')
    expect(await el.getAttribute('content')).toBe('a vite app')

    const kw = await page.$('html meta[name=keywords]')
    expect(await kw.getAttribute('content')).toBe('es modules')
  })
})

describe('noBody', () => {
  beforeAll(async () => {
    await page.goto(viteTestUrl + '/noBody.html')
  })

  test('noBody tags injection', async () => {
    // this selects the first noscript in body, even without a body tag
    const el = await page.$('body noscript')
    expect(await el.innerHTML()).toMatch(`<!-- this is prepended to body -->`)

    const kw = await page.$('html:last-child')
    expect(await kw.innerHTML()).toMatch(`<!-- this is appended to body -->`)
  })
})

describe('Unicode path', () => {
  test('direct access', async () => {
    await page.goto(
      viteTestUrl + '/unicode-path/中文-にほんご-한글-🌕🌖🌗/index.html',
    )
    expect(await page.textContent('h1')).toBe('Unicode path')
  })

  test('spa fallback', async () => {
    await page.goto(viteTestUrl + '/unicode-path/中文-にほんご-한글-🌕🌖🌗/')
    expect(await page.textContent('h1')).toBe('Unicode path')
  })
})

describe('link with props', () => {
  test('separate links with different media props', async () => {
    await page.goto(viteTestUrl + '/link-props/index.html')
    expect(await getColor('h1')).toBe('red')
  })
})

describe.runIf(isServe)('invalid', () => {
  test('should be 500 with overlay', async () => {
    const response = await page.goto(viteTestUrl + '/invalid.html')
    expect(response.status()).toBe(500)

    const errorOverlay = await page.waitForSelector('vite-error-overlay')
    expect(errorOverlay).toBeTruthy()

    const message = await errorOverlay.$$eval('.message-body', (m) => {
      return m[0].innerHTML
    })
    expect(message).toMatch(/^Unable to parse HTML/)
  })

  test('should close overlay when clicked away', async () => {
    await page.goto(viteTestUrl + '/invalid.html')
    const errorOverlay = await page.waitForSelector('vite-error-overlay')
    expect(errorOverlay).toBeTruthy()

    await page.click('html')
    const isVisibleOverlay = await errorOverlay.isVisible()
    expect(isVisibleOverlay).toBeFalsy()
  })

  test('should close overlay when escape key is pressed', async () => {
    await page.goto(viteTestUrl + '/invalid.html')
    const errorOverlay = await page.waitForSelector('vite-error-overlay')
    expect(errorOverlay).toBeTruthy()

    await page.keyboard.press('Escape')
    const isVisibleOverlay = await errorOverlay.isVisible()
    expect(isVisibleOverlay).toBeFalsy()
  })

  test('stack is updated', async () => {
    await page.goto(viteTestUrl + '/invalid.html')

    const errorOverlay = await page.waitForSelector('vite-error-overlay')
    const hiddenPromise = errorOverlay.waitForElementState('hidden')
    await page.keyboard.press('Escape')
    await hiddenPromise

    viteServer.environments.client.hot.send({
      type: 'error',
      err: {
        message: 'someError',
        stack: [
          'Error: someError',
          '    at someMethod (/some/file.ts:1:2)',
        ].join('\n'),
      },
    })
    const newErrorOverlay = await page.waitForSelector('vite-error-overlay')
    const stack = await newErrorOverlay.$$eval('.stack', (m) => m[0].innerHTML)
    expect(stack).toMatch(/^Error: someError/)
  })

  test('should reload when fixed', async () => {
    await untilBrowserLogAfter(
      () => page.goto(viteTestUrl + '/invalid.html'),
      /connected/, // wait for HMR connection
    )
    editFile('invalid.html', (content) => {
      return content.replace('<div Bad', '<div> Good')
    })
    const content = await page.waitForSelector('text=Good HTML')
    expect(content).toBeTruthy()
  })
})

describe('Valid HTML', () => {
  test('valid HTML is parsed', async () => {
    await page.goto(viteTestUrl + '/valid.html')
    expect(await page.textContent('#no-quotes-on-attr')).toBe(
      'No quotes on Attr working',
    )

    expect(await getColor('#duplicated-attrs')).toBe('green')
  })
})

describe('env', () => {
  beforeAll(async () => {
    await page.goto(viteTestUrl + '/env.html')
  })

  test('env works', async () => {
    expect(await page.textContent('.env')).toBe('bar')
    expect(await page.textContent('.env-define')).toBe('5173')
    expect(await page.textContent('.env-define-string')).toBe('string')
    expect(await page.textContent('.env-define-object-string')).toBe(
      '{ "foo": "bar" }',
    )
    expect(await page.textContent('.env-define-null-string')).toBe('null')
    expect(await page.textContent('.env-bar')).toBeTruthy()
    expect(await page.textContent('.env-prod')).toBe(isBuild + '')
    expect(await page.textContent('.env-dev')).toBe(isServe + '')

    const iconLink = await page.$('link[rel=icon]')
    expect(await iconLink.getAttribute('href')).toBe(
      `${isBuild ? './' : '/'}sprite.svg`,
    )
  })
})

describe('importmap', () => {
  beforeAll(async () => {
    await page.goto(viteTestUrl + '/importmapOrder.html')
  })

  // Should put this test at the end to get all browser logs above
  test('importmap should be prepended', async () => {
    expect(browserLogs).not.toContain(
      'An import map is added after module script load was triggered.',
    )
  })
})

describe('side-effects', () => {
  beforeAll(async () => {
    await page.goto(viteTestUrl + '/side-effects/')
  })

  test('console.log is not tree-shaken', async () => {
    expect(browserLogs).toContain('message from sideEffects script')
  })
})

describe('special character', () => {
  beforeAll(async () => {
    await page.goto(viteTestUrl + '/a á.html')
  })

  test('should fetch html proxy', async () => {
    expect(browserLogs).toContain('special character')
  })
})

describe('relative input', () => {
  beforeAll(async () => {
    await page.goto(viteTestUrl + '/relative-input.html')
  })

  test('passing relative path to rollupOptions.input works', async () => {
    await expectWithRetry(() => page.textContent('.relative-input')).toBe('OK')
  })
})

describe.runIf(isServe)('warmup', () => {
  test('should warmup /warmup/warm.js', async () => {
    // warmup transform files async during server startup, so the module check
    // here might take a while to load
    await withRetry(async () => {
      const mod =
        await viteServer.environments.client.moduleGraph.getModuleByUrl(
          '/warmup/warm.js',
        )
      expect(mod).toBeTruthy()
    })
  })
})

test('html serve behavior', async () => {
  const [
    file,
    fileSlash,
    fileDotHtml,

    folder,
    folderSlash,
    folderSlashIndexHtml,

    both,
    bothSlash,
    bothDotHtml,
    bothSlashIndexHtml,
  ] = await Promise.all([
    fetchHtml('/serve/file'), // -> serve/file.html
    fetchHtml('/serve/file/'), // -> index.html (404 in mpa)
    fetchHtml('/serve/file.html'), // -> serve/file.html

    fetchHtml('/serve/folder'), // -> index.html (404 in mpa)
    fetchHtml('/serve/folder/'), // -> serve/folder/index.html
    fetchHtml('/serve/folder/index.html'), // -> serve/folder/index.html

    fetchHtml('/serve/both'), // -> serve/both.html
    fetchHtml('/serve/both/'), // -> serve/both/index.html
    fetchHtml('/serve/both.html'), // -> serve/both.html
    fetchHtml('/serve/both/index.html'), // -> serve/both/index.html
  ])

  expect(file.status).toBe(200)
  expect(await file.text()).toContain('file.html')
  expect(fileSlash.status).toBe(200)
  expect(await fileSlash.text()).toContain('index.html (fallback)')
  expect(fileDotHtml.status).toBe(200)
  expect(await fileDotHtml.text()).toContain('file.html')

  expect(folder.status).toBe(200)
  expect(await folder.text()).toContain('index.html (fallback)')
  expect(folderSlash.status).toBe(200)
  expect(await folderSlash.text()).toContain('folder/index.html')
  expect(folderSlashIndexHtml.status).toBe(200)
  expect(await folderSlashIndexHtml.text()).toContain('folder/index.html')

  expect(both.status).toBe(200)
  expect(await both.text()).toContain('both.html')
  expect(bothSlash.status).toBe(200)
  expect(await bothSlash.text()).toContain('both/index.html')
  expect(bothDotHtml.status).toBe(200)
  expect(await bothDotHtml.text()).toContain('both.html')
  expect(bothSlashIndexHtml.status).toBe(200)
  expect(await bothSlashIndexHtml.text()).toContain('both/index.html')
})

test('html fallback works non browser accept header', async () => {
  expect((await fetch(viteTestUrl, { headers: { Accept: '' } })).status).toBe(
    200,
  )
  // defaults to "Accept: */*"
  expect((await fetch(viteTestUrl)).status).toBe(200)
  // wait-on uses axios and axios sends this accept header
  expect(
    (
      await fetch(viteTestUrl, {
        headers: { Accept: 'application/json, text/plain, */*' },
      })
    ).status,
  ).toBe(200)
})

test('escape html attribute', async () => {
  const el = await page.$('.unescape-div')
  expect(el).toBeNull()
})

test('invalidate inline proxy module on reload', async () => {
  await page.goto(`${viteTestUrl}/transform-inline-js`)
  expect(await page.textContent('.test')).toContain('ok')
  await page.reload()
  expect(await page.textContent('.test')).toContain('ok')
  await page.reload()
  expect(await page.textContent('.test')).toContain('ok')
})
