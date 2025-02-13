import { expect, test } from 'vitest'
import {
  browserLogs,
  findAssetFile,
  getColor,
  isBuild,
  page,
  serverLogs,
  untilUpdated,
} from '~utils'

test('should load literal dynamic import', async () => {
  await page.click('.baz')
  await untilUpdated(() => page.textContent('.view'), 'Baz view')
})

test('should load full dynamic import from public', async () => {
  await page.click('.qux')
  await untilUpdated(() => page.textContent('.view'), 'Qux view')
  // No warning should be logged as we are using @vite-ignore
  expect(
    serverLogs.some((log) => log.includes('cannot be analyzed by vite')),
  ).toBe(false)
})

test('should load data URL of `blob:`', async () => {
  await page.click('.issue-2658-1')
  await untilUpdated(() => page.textContent('.view'), 'blob')
})

test('should load data URL of `data:`', async () => {
  await page.click('.issue-2658-2')
  await untilUpdated(() => page.textContent('.view'), 'data')
})

test('should have same reference on static and dynamic js import, .mxd', async () => {
  await page.click('.mxd')
  await untilUpdated(() => page.textContent('.view'), 'true')
})

// in this case, it is not possible to detect the correct module
test('should have same reference on static and dynamic js import, .mxd2', async () => {
  await page.click('.mxd2')
  await untilUpdated(() => page.textContent('.view'), 'false')
})

test('should have same reference on static and dynamic js import, .mxdjson', async () => {
  await page.click('.mxdjson')
  await untilUpdated(() => page.textContent('.view'), 'true')
})

// since this test has a timeout, it should be put last so that it
// does not bleed on the last
test('should load dynamic import with vars', async () => {
  await page.click('.foo')
  await untilUpdated(() => page.textContent('.view'), 'Foo view')

  await page.click('.bar')
  await untilUpdated(() => page.textContent('.view'), 'Bar view')
})

// dynamic import css
test('should load dynamic import with css', async () => {
  await page.click('.css')
  await untilUpdated(
    () => page.$eval('.view', (node) => window.getComputedStyle(node).color),
    'rgb(255, 0, 0)',
  )
})

test('should load dynamic import with vars', async () => {
  await untilUpdated(
    () => page.textContent('.dynamic-import-with-vars'),
    'hello',
  )
})

test('should load dynamic import with vars ignored', async () => {
  await untilUpdated(
    () => page.textContent('.dynamic-import-with-vars-ignored'),
    'hello',
  )
  // No warning should be logged as we are using @vite-ignore
  expect(
    serverLogs.some((log) =>
      log.includes('"https" has been externalized for browser compatibility'),
    ),
  ).toBe(false)
})

test('should load dynamic import with double slash ignored', async () => {
  await untilUpdated(
    () => page.textContent('.dynamic-import-with-double-slash-ignored'),
    'hello',
  )
})

test('should load dynamic import with vars multiline', async () => {
  await untilUpdated(
    () => page.textContent('.dynamic-import-with-vars-multiline'),
    'hello',
  )
})

test('should load dynamic import with vars alias', async () => {
  await untilUpdated(
    () => page.textContent('.dynamic-import-with-vars-alias'),
    'hi',
  )
})

test('should load dynamic import with vars raw', async () => {
  await untilUpdated(
    () => page.textContent('.dynamic-import-with-vars-raw'),
    'export function hello()',
  )
})

test('should load dynamic import with vars url', async () => {
  await untilUpdated(
    () => page.textContent('.dynamic-import-with-vars-url'),
    isBuild ? 'data:text/javascript' : '/alias/url.js',
  )
})

test('should load dynamic import with vars worker', async () => {
  await untilUpdated(
    () => page.textContent('.dynamic-import-with-vars-worker'),
    'load worker',
  )
})

test('should load dynamic import with css in package', async () => {
  await page.click('.pkg-css')
  await untilUpdated(() => getColor('.pkg-css'), 'blue')
})

test('should work with load ../ and itself directory', async () => {
  await untilUpdated(
    () => page.textContent('.dynamic-import-self'),
    'dynamic-import-self-content',
  )
})

test('should work with load ../ and contain itself directory', async () => {
  await untilUpdated(
    () => page.textContent('.dynamic-import-nested-self'),
    'dynamic-import-nested-self-content',
  )
})

test('should work a load path that contains parentheses.', async () => {
  await untilUpdated(
    () => page.textContent('.dynamic-import-with-vars-contains-parenthesis'),
    'dynamic-import-with-vars-contains-parenthesis',
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

test('dynamic import treeshaken log', async () => {
  const log = browserLogs.join('\n')
  expect(log).toContain('treeshaken foo')
  expect(log).toContain('treeshaken bar')
  expect(log).toContain('treeshaken baz1')
  expect(log).toContain('treeshaken baz2')
  expect(log).toContain('treeshaken baz3')
  expect(log).toContain('treeshaken baz4')
  expect(log).toContain('treeshaken baz5')
  expect(log).toContain('treeshaken default')

  expect(log).not.toContain('treeshaken removed')
})

test('dynamic import syntax parsing', async () => {
  const log = browserLogs.join('\n')
  expect(log).toContain('treeshaken syntax foo')
  expect(log).toContain('treeshaken syntax default')
})

test.runIf(isBuild)('dynamic import treeshaken file', async () => {
  expect(findAssetFile(/treeshaken.+\.js$/)).not.toContain('treeshaken removed')
})

test.runIf(isBuild)('should not preload for non-analyzable urls', () => {
  const js = findAssetFile(/index-[-\w]{8}\.js$/)
  // should match e.g. await import(e.jss);o(".view",p===i)
  expect(js).to.match(/\.jss\);/)
})
