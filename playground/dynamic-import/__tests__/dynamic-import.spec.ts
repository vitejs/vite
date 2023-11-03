import { expect, test } from 'vitest'
import { getColor, isBuild, page, serverLogs, untilUpdated } from '~utils'

test('should load literal dynamic import', async () => {
  await page.click('.baz')
  await untilUpdated(() => page.textContent('.view'), 'Baz view', true)
})

test('should load full dynamic import from public', async () => {
  await page.click('.qux')
  await untilUpdated(() => page.textContent('.view'), 'Qux view', true)
  // No warning should be logged as we are using @vite-ignore
  expect(
    serverLogs.some((log) => log.includes('cannot be analyzed by vite')),
  ).toBe(false)
})

test('should load data URL of `blob:`', async () => {
  await page.click('.issue-2658-1')
  await untilUpdated(() => page.textContent('.view'), 'blob', true)
})

test('should load data URL of `data:`', async () => {
  await page.click('.issue-2658-2')
  await untilUpdated(() => page.textContent('.view'), 'data', true)
})

test('should have same reference on static and dynamic js import, .mxd', async () => {
  await page.click('.mxd')
  await untilUpdated(() => page.textContent('.view'), 'true', true)
})

// in this case, it is not possible to detect the correct module
test('should have same reference on static and dynamic js import, .mxd2', async () => {
  await page.click('.mxd2')
  await untilUpdated(() => page.textContent('.view'), 'false', true)
})

test('should have same reference on static and dynamic js import, .mxdjson', async () => {
  await page.click('.mxdjson')
  await untilUpdated(() => page.textContent('.view'), 'true', true)
})

// since this test has a timeout, it should be put last so that it
// does not bleed on the last
test('should load dynamic import with vars', async () => {
  await page.click('.foo')
  await untilUpdated(() => page.textContent('.view'), 'Foo view', true)

  await page.click('.bar')
  await untilUpdated(() => page.textContent('.view'), 'Bar view', true)
})

// dynamic import css
test('should load dynamic import with css', async () => {
  await page.click('.css')
  await untilUpdated(
    () => page.$eval('.view', (node) => window.getComputedStyle(node).color),
    'rgb(255, 0, 0)',
    true,
  )
})

test('should load dynamic import with vars', async () => {
  await untilUpdated(
    () => page.textContent('.dynamic-import-with-vars'),
    'hello',
    true,
  )
})

test('should load dynamic import with vars ignored', async () => {
  await untilUpdated(
    () => page.textContent('.dynamic-import-with-vars-ignored'),
    'hello',
    true,
  )
  // No warning should be logged as we are using @vite-ignore
  expect(
    serverLogs.some((log) =>
      log.includes('"https" has been externalized for browser compatibility'),
    ),
  ).toBe(false)
})

test('should load dynamic import with vars multiline', async () => {
  await untilUpdated(
    () => page.textContent('.dynamic-import-with-vars-multiline'),
    'hello',
    true,
  )
})

test('should load dynamic import with vars alias', async () => {
  await untilUpdated(
    () => page.textContent('.dynamic-import-with-vars-alias'),
    'hi',
    true,
  )
})

test('should load dynamic import with vars raw', async () => {
  await untilUpdated(
    () => page.textContent('.dynamic-import-with-vars-raw'),
    'export function hello()',
    true,
  )
})

test('should load dynamic import with vars url', async () => {
  await untilUpdated(
    () => page.textContent('.dynamic-import-with-vars-url'),
    isBuild ? 'data:application/javascript' : '/alias/url.js',
    true,
  )
})

test('should load dynamic import with vars worker', async () => {
  await untilUpdated(
    () => page.textContent('.dynamic-import-with-vars-worker'),
    'load worker',
    true,
  )
})

test('should load dynamic import with css in package', async () => {
  await page.click('.pkg-css')
  await untilUpdated(() => getColor('.pkg-css'), 'blue', true)
})

test('should work with load ../ and itself directory', async () => {
  await untilUpdated(
    () => page.textContent('.dynamic-import-self'),
    'dynamic-import-self-content',
    true,
  )
})

test('should work with load ../ and contain itself directory', async () => {
  await untilUpdated(
    () => page.textContent('.dynamic-import-nested-self'),
    'dynamic-import-nested-self-content',
    true,
  )
})

test.runIf(isBuild)(
  'should rollup warn when static and dynamic import a module in same chunk',
  async () => {
    const log = serverLogs.join('\n')
    expect(log).toContain(
      'dynamic import will not move module into another chunk',
    )
    expect(log).toMatch(
      /\(!\).*\/dynamic-import\/files\/mxd\.js is dynamically imported by/,
    )
    expect(log).toMatch(
      /\(!\).*\/dynamic-import\/files\/mxd\.json is dynamically imported by/,
    )
    expect(log).not.toMatch(
      /\(!\).*\/dynamic-import\/nested\/shared\.js is dynamically imported by/,
    )
  },
)
