import { getColor, isBuild, mochaSetup, mochaReset } from '../../testUtils'

function testPage(isNested: boolean) {
  it('pre transform', async () => {
    expect(await page.$('head meta[name=viewport]')).toBeTruthy()
  })

  it('string transform', async () => {
    expect(await page.textContent('h1')).toBe(
      isNested ? 'Nested' : 'Transformed'
    )
  })

  it('tags transform', async () => {
    const el = await page.$('head meta[name=description]')
    expect(await el.getAttribute('content')).toBe('a vite app')

    const kw = await page.$('head meta[name=keywords]')
    expect(await kw.getAttribute('content')).toBe('es modules')
  })

  it('combined transform', async () => {
    expect(await page.title()).toBe('Test HTML transforms')
    // the p should be injected to body
    expect(await page.textContent('body p.inject')).toBe('This is injected')
  })

  it('server only transform', async () => {
    if (!isBuild) {
      expect(await page.textContent('body p.server')).toMatch(
        'injected only during dev'
      )
    } else {
      expect(await page.innerHTML('body')).not.toMatch('p class="server"')
    }
  })

  it('build only transform', async () => {
    if (isBuild) {
      expect(await page.textContent('body p.build')).toMatch(
        'injected only during build'
      )
    } else {
      expect(await page.innerHTML('body')).not.toMatch('p class="build"')
    }
  })

  it('conditional transform', async () => {
    if (isNested) {
      expect(await page.textContent('body p.conditional')).toMatch(
        'injected only for /nested/'
      )
    } else {
      expect(await page.innerHTML('body')).not.toMatch('p class="conditional"')
    }
  })

  it('body prepend/append transform', async () => {
    expect(await page.innerHTML('body')).toMatch(
      /prepended to body(.*)appended to body/s
    )
  })

  it('css', async () => {
    expect(await getColor('h1')).toBe(isNested ? 'red' : 'blue')
    expect(await getColor('p')).toBe('grey')
  })
}

describe('html.spec.ts', () => {
  before(mochaSetup)
  after(mochaReset)

  describe('main', () => {
    testPage(false)

    it('preserve comments', async () => {
      const html = await page.innerHTML('body')
      expect(html).toMatch(`<!-- comment one -->`)
      expect(html).toMatch(`<!-- comment two -->`)
    })
  })

  describe('nested', () => {
    before(async () => {
      // viteTestUrl is globally injected in scripts/jestPerTestSetup.ts
      await page.goto(viteTestUrl + '/nested/')
    })

    testPage(true)
  })

  describe('nested w/ query', () => {
    before(async () => {
      // viteTestUrl is globally injected in scripts/jestPerTestSetup.ts
      await page.goto(viteTestUrl + '/nested/index.html?v=1')
    })

    testPage(true)
  })

  if (isBuild) {
    describe('scriptAsync', () => {
      before(async () => {
        // viteTestUrl is globally injected in scripts/jestPerTestSetup.ts
        await page.goto(viteTestUrl + '/scriptAsync.html')
      })

      it('script is async', async () => {
        expect(await page.$('head script[type=module][async]')).toBeTruthy()
        expect(await page.$('head script[type=module]:not([async])')).toBeNull()
      })
    })

    describe('scriptMixed', () => {
      before(async () => {
        // viteTestUrl is globally injected in scripts/jestPerTestSetup.ts
        await page.goto(viteTestUrl + '/scriptMixed.html')
      })

      it('script is mixed', async () => {
        expect(await page.$('head script[type=module][async]')).toBeNull()
        expect(
          await page.$('head script[type=module]:not([async])')
        ).toBeTruthy()
      })
    })

    describe('zeroJS', () => {
      // Ensure that the modulePreload polyfill is discarded in this case

      before(async () => {
        // viteTestUrl is globally injected in scripts/jestPerTestSetup.ts
        await page.goto(viteTestUrl + '/zeroJS.html')
      })

      it('zeroJS', async () => {
        expect(await page.$('head script[type=module]')).toBeNull()
      })
    })

    describe('inline entry', () => {
      const _countTags = (selector) => page.$$eval(selector, (t) => t.length)
      const countScriptTags = _countTags.bind(this, 'script[type=module]')
      const countPreloadTags = _countTags.bind(this, 'link[rel=modulepreload]')

      it('is inlined', async () => {
        await page.goto(viteTestUrl + '/inline/shared-1.html?v=1')
        expect(await countScriptTags()).toBeGreaterThan(1)
        expect(await countPreloadTags()).toBe(0)
      })

      it('is not inlined', async () => {
        await page.goto(viteTestUrl + '/inline/unique.html?v=1')
        expect(await countScriptTags()).toBe(1)
        expect(await countPreloadTags()).toBeGreaterThan(0)
      })

      it('execution order when inlined', async () => {
        await page.goto(viteTestUrl + '/inline/shared-2.html?v=1')
        expect((await page.textContent('#output')).trim()).toBe(
          'dep1 common dep2 dep3 shared'
        )
      })

      it('execution order when not inlined', async () => {
        await page.goto(viteTestUrl + '/inline/unique.html?v=1')
        expect((await page.textContent('#output')).trim()).toBe(
          'dep1 common dep2 unique'
        )
      })
    })
  }

  describe('noHead', () => {
    before(async () => {
      // viteTestUrl is globally injected in scripts/jestPerTestSetup.ts
      await page.goto(viteTestUrl + '/noHead.html')
    })

    it('noHead tags injection', async () => {
      const el = await page.$('html meta[name=description]')
      expect(await el.getAttribute('content')).toBe('a vite app')

      const kw = await page.$('html meta[name=keywords]')
      expect(await kw.getAttribute('content')).toBe('es modules')
    })
  })

  describe('noBody', () => {
    before(async () => {
      // viteTestUrl is globally injected in scripts/jestPerTestSetup.ts
      await page.goto(viteTestUrl + '/noBody.html')
    })

    it('noBody tags injection', async () => {
      // this selects the first noscript in body, even without a body tag
      const el = await page.$('body noscript')
      expect(await el.innerHTML()).toMatch(`<!-- this is prepended to body -->`)

      const kw = await page.$('html:last-child')
      expect(await kw.innerHTML()).toMatch(`<!-- this is appended to body -->`)
    })
  })

  describe('unicode path', () => {
    it('direct access', async () => {
      await page.goto(
        viteTestUrl + '/unicode-path/中文-にほんご-한글-🌕🌖🌗/index.html'
      )
      expect(await page.textContent('h1')).toBe('unicode-path')
    })

    it('spa fallback', async () => {
      await page.goto(viteTestUrl + '/unicode-path/中文-にほんご-한글-🌕🌖🌗/')
      expect(await page.textContent('h1')).toBe('unicode-path')
    })
  })
})
