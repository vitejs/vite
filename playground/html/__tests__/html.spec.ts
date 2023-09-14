import { beforeAll, describe, expect, test } from 'vitest'
import {
  browserLogs,
  editFile,
  getColor,
  isBuild,
  isServe,
  page,
  viteServer,
  viteTestUrl,
  withRetry,
} from '~utils'

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
    const isVisbleOverlay = await errorOverlay.isVisible()
    expect(isVisbleOverlay).toBeFalsy()
  })

  test('should close overlay when escape key is pressed', async () => {
    await page.goto(viteTestUrl + '/invalid.html')
    const errorOverlay = await page.waitForSelector('vite-error-overlay')
    expect(errorOverlay).toBeTruthy()

    await page.keyboard.press('Escape')
    const isVisbleOverlay = await errorOverlay.isVisible()
    expect(isVisbleOverlay).toBeFalsy()
  })

  test('should reload when fixed', async () => {
    await page.goto(viteTestUrl + '/invalid.html')
    await editFile('invalid.html', (content) => {
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
    expect(await page.textContent('.env-define-template-literal')).toBe(
      '`template literal`', // only double quotes will be unquoted
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

describe.runIf(isServe)('warmup', () => {
  test('should warmup /warmup/warm.js', async () => {
    // warmup transform files async during server startup, so the module check
    // here might take a while to load
    await withRetry(async () => {
      const mod = await viteServer.moduleGraph.getModuleByUrl('/warmup/warm.js')
      expect(mod).toBeTruthy()
    })
  })
})
