import {
  browserLogs,
  editFile,
  getBgColor,
  getColor,
  isBuild,
  page,
  timeout,
  untilUpdated,
  viteTestUrl
} from '~utils'

test('should render', async () => {
  expect(await page.textContent('#pagetitle')).toBe('|Page title|')
})

if (!isBuild) {
  test('regenerate CSS and HMR (glob pattern)', async () => {
    browserLogs.length = 0
    const el = await page.$('#pagetitle')
    const el2 = await page.$('#helloroot')

    expect(await getColor(el)).toBe('rgb(11, 22, 33)')

    editFile('src/views/Page.vue', (code) =>
      code.replace('|Page title|', '|Page title updated|')
    )
    await untilUpdated(() => el.textContent(), '|Page title updated|')

    expect(browserLogs).toMatchObject([
      '[vite] css hot updated: /index.css',
      '[vite] hot updated: /src/views/Page.vue'
    ])

    browserLogs.length = 0

    editFile('src/components/HelloWorld.vue', (code) =>
      code.replace('text-gray-800', 'text-[rgb(10,20,30)]')
    )

    await untilUpdated(() => getColor(el2), 'rgb(10, 20, 30)')

    expect(browserLogs).toMatchObject([
      '[vite] css hot updated: /index.css',
      '[vite] hot updated: /src/components/HelloWorld.vue'
    ])

    browserLogs.length = 0
  })

  test('regenerate CSS and HMR (relative path)', async () => {
    browserLogs.length = 0
    const el = await page.$('h1')

    expect(await getColor(el)).toBe('black')

    editFile('src/App.vue', (code) =>
      code.replace('text-black', 'text-[rgb(11,22,33)]')
    )

    await untilUpdated(() => getColor(el), 'rgb(11, 22, 33)')

    expect(browserLogs).toMatchObject([
      '[vite] css hot updated: /index.css',
      '[vite] hot updated: /src/App.vue'
    ])

    browserLogs.length = 0
  })

  test('regenerate CSS and HMR (pug template)', async () => {
    browserLogs.length = 0
    const el = await page.$('.pug')

    expect(await getBgColor(el)).toBe('rgb(248, 113, 113)')

    editFile('src/components/PugTemplate.vue', (code) =>
      code.replace('bg-red-400', 'bg-red-600')
    )

    await untilUpdated(() => getBgColor(el), 'rgb(220, 38, 38)')

    expect(browserLogs).toMatchObject([
      '[vite] css hot updated: /index.css',
      '[vite] hot updated: /src/components/PugTemplate.vue?vue&type=template&lang.js'
    ])

    browserLogs.length = 0
  })

  describe('tailwindcss html hmr', () => {
    test("shouldn't full-reload", async () => {
      await page.goto(viteTestUrl)
      editFile('hmr.html', (code) => code)
      try {
        await page.waitForNavigation({ timeout: 500 })
      } catch (err) {
        const errMsg = 'page.waitForNavigation: Timeout 500ms exceeded.'
        expect(err.message.slice(0, errMsg.length)).toBe(errMsg)
      }
    })

    test('data.path should be defined', async () => {
      browserLogs.length = 0
      await page.goto(viteTestUrl)
      editFile('hmr.html', (code) => code)
      await timeout(500)
      expect(browserLogs.includes('data.path: /hmr.html')).toBeTruthy()
      browserLogs.length = 0
    })
  })
}
