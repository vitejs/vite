import { describe, expect, test } from 'vitest'
import {
  browserErrors,
  browserLogs,
  getColor,
  isBuild,
  isServe,
  page,
  readDepOptimizationMetadata,
  serverLogs,
  viteTestUrl,
} from '~utils'

test('default + named imports from cjs dep (react)', async () => {
  await expect.poll(() => page.textContent('.cjs button')).toBe('count is 0')
  await page.click('.cjs button')
  await expect.poll(() => page.textContent('.cjs button')).toBe('count is 1')
})

test('named imports from webpacked cjs (phoenix)', async () => {
  await expect.poll(() => page.textContent('.cjs-phoenix')).toBe('ok')
})

test('default import from webpacked cjs (clipboard)', async () => {
  await expect.poll(() => page.textContent('.cjs-clipboard')).toBe('ok')
})

test('default import from cjs (cjs-dep-cjs-compiled-from-esm)', async () => {
  await expect
    .poll(() => page.textContent('.cjs-dep-cjs-compiled-from-esm'))
    .toBe('ok')
})

test('default import from cjs (cjs-dep-cjs-compiled-from-cjs)', async () => {
  await expect
    .poll(() => page.textContent('.cjs-dep-cjs-compiled-from-cjs'))
    .toBe('ok')
})

test('dynamic imports from cjs dep (react)', async () => {
  await expect
    .poll(() => page.textContent('.cjs-dynamic button'))
    .toBe('count is 0')
  await page.click('.cjs-dynamic button')
  await expect
    .poll(() => page.textContent('.cjs-dynamic button'))
    .toBe('count is 1')
})

test('dynamic named imports from webpacked cjs (phoenix)', async () => {
  await expect.poll(() => page.textContent('.cjs-dynamic-phoenix')).toBe('ok')
})

test('dynamic default import from webpacked cjs (clipboard)', async () => {
  await expect.poll(() => page.textContent('.cjs-dynamic-clipboard')).toBe('ok')
})

test('dynamic default import from cjs (cjs-dynamic-dep-cjs-compiled-from-esm)', async () => {
  await expect
    .poll(() => page.textContent('.cjs-dynamic-dep-cjs-compiled-from-esm'))
    .toBe('ok')
})

test('dynamic default import from cjs (cjs-dynamic-dep-cjs-compiled-from-cjs)', async () => {
  await expect
    .poll(() => page.textContent('.cjs-dynamic-dep-cjs-compiled-from-cjs'))
    .toBe('ok')
})

test('dedupe', async () => {
  await expect.poll(() => page.textContent('.dedupe button')).toBe('count is 0')
  await page.click('.dedupe button')
  await expect.poll(() => page.textContent('.dedupe button')).toBe('count is 1')
})

test('cjs browser field (axios)', async () => {
  await expect.poll(() => page.textContent('.cjs-browser-field')).toBe('pong')
})

test('cjs browser field bare', async () => {
  await expect
    .poll(() => page.textContent('.cjs-browser-field-bare'))
    .toBe('pong')
})

test('dep from linked dep (lodash-es)', async () => {
  await expect.poll(() => page.textContent('.deps-linked')).toBe('fooBarBaz')
})

test('forced include', async () => {
  await expect
    .poll(() => page.textContent('.force-include'))
    .toMatch(`[success]`)
})

test('import * from optimized dep', async () => {
  await expect.poll(() => page.textContent('.import-star')).toMatch(`[success]`)
})

test('import from dep with process.env.NODE_ENV', async () => {
  await expect
    .poll(() => page.textContent('.node-env'))
    .toMatch(isBuild ? 'prod' : 'dev')
})

test('import from dep with .notjs files', async () => {
  await expect.poll(() => page.textContent('.not-js')).toMatch(`[success]`)
})

test('Import from dependency which uses relative path which needs to be resolved by main field', async () => {
  await expect
    .poll(() => page.textContent('.relative-to-main'))
    .toMatch(`[success]`)
})

test('dep with dynamic import', async () => {
  await expect
    .poll(() => page.textContent('.dep-with-dynamic-import'))
    .toMatch(`[success]`)
})

test('dep with optional peer dep', async () => {
  await expect
    .poll(() => page.textContent('.dep-with-optional-peer-dep'))
    .toMatch(`[success]`)
  await expect
    .poll(() => page.textContent('.dep-with-optional-peer-dep-error'))
    .toMatch(`[success]`)
})

test('dep with optional peer dep submodule', async () => {
  await expect
    .poll(() => page.textContent('.dep-with-optional-peer-dep-submodule'))
    .toMatch(`[success]`)
  await expect
    .poll(() => page.textContent('.dep-with-optional-peer-dep-submodule-error'))
    .toMatch(`[success]`)
})

test('dep with optional peer dep (cjs)', async () => {
  await expect
    .poll(() => page.textContent('.dep-with-optional-peer-dep-cjs'))
    .toMatch(`[success]`)
  // FIXME
  // await expect
  //   .poll(() => page.textContent('.dep-with-optional-peer-dep-cjs-error'))
  //   .toMatch(`[success]`)
})

test('dep with css import', async () => {
  await expect.poll(() => getColor('.dep-linked-include')).toBe('red')
})

test('CJS dep with css import', async () => {
  await expect.poll(() => getColor('.cjs-with-assets')).toBe('blue')
})

test('externalize known non-js files in optimize included dep', async () => {
  await expect
    .poll(() => page.textContent('.externalize-known-non-js'))
    .toMatch(`[success]`)
})

test('vue + vuex', async () => {
  await expect.poll(() => page.textContent('.vue')).toMatch(`[success]`)
})

// When we use the Rollup CommonJS plugin instead of esbuild prebundling,
// the esbuild plugins won't apply to dependencies
test.runIf(isServe)('esbuild-plugin', async () => {
  await expect
    .poll(() => page.textContent('.esbuild-plugin'))
    .toMatch(`Hello from an esbuild plugin`)
})

test('import from hidden dir', async () => {
  await expect.poll(() => page.textContent('.hidden-dir')).toBe('hello!')
})

test('import optimize-excluded package that imports optimized-included package', async () => {
  await expect
    .poll(() => page.textContent('.nested-include'))
    .toBe('nested-include')
})

test('import aliased package with colon', async () => {
  await expect.poll(() => page.textContent('.url')).toBe('vite.dev')
})

test('import aliased package using absolute path', async () => {
  await expect
    .poll(() => page.textContent('.alias-using-absolute-path'))
    .toBe('From dep-alias-using-absolute-path')
})

test('variable names are reused in different scripts', async () => {
  await expect
    .poll(() => page.textContent('.reused-variable-names'))
    .toBe('reused')
})

test('flatten id should generate correctly', async () => {
  await expect
    .poll(() => page.textContent('.clonedeep-slash'))
    .toBe('clonedeep-slash')
  await expect
    .poll(() => page.textContent('.clonedeep-dot'))
    .toBe('clonedeep-dot')
})

test('non optimized module is not duplicated', async () => {
  await expect
    .poll(() => page.textContent('.non-optimized-module-is-not-duplicated'))
    .toBe('from-absolute-path, from-relative-path')
})

test.runIf(isServe)('error on builtin modules usage', () => {
  expect(browserLogs).toEqual(
    expect.arrayContaining([
      // from dep-with-builtin-module-esm
      expect.stringMatching(/dep-with-builtin-module-esm.*is not a function/),
      // dep-with-builtin-module-esm warnings
      expect.stringContaining(
        'Module "fs" has been externalized for browser compatibility. Cannot access "fs.readFileSync" in client code.',
      ),
      expect.stringContaining(
        'Module "path" has been externalized for browser compatibility. Cannot access "path.join" in client code.',
      ),
      // from dep-with-builtin-module-cjs
      expect.stringMatching(/dep-with-builtin-module-cjs.*is not a function/),
      // dep-with-builtin-module-cjs warnings
      expect.stringContaining(
        'Module "fs" has been externalized for browser compatibility. Cannot access "fs.readFileSync" in client code.',
      ),
      expect.stringContaining(
        'Module "path" has been externalized for browser compatibility. Cannot access "path.join" in client code.',
      ),
    ]),
  )

  expect(browserErrors.map((error) => error.message)).toEqual(
    expect.arrayContaining([
      // from user source code
      expect.stringContaining(
        'Module "buffer" has been externalized for browser compatibility. Cannot access "buffer.Buffer" in client code.',
      ),
      expect.stringContaining(
        'Module "child_process" has been externalized for browser compatibility. Cannot access "child_process.execSync" in client code.',
      ),
    ]),
  )
})

test('pre bundle css require', async () => {
  if (isServe) {
    const response = page.waitForResponse(/@vitejs_test-dep-css-require\.js/)
    await page.goto(viteTestUrl)
    const content = await (await response).text()
    expect(content).toMatch(
      /import\s"\/@fs.+@vitejs\/test-dep-css-require\/style\.css"/,
    )
  }

  await expect.poll(() => getColor('.css-require')).toBe('red')
  await expect.poll(() => getColor('.css-module-require')).toBe('red')
})

test.runIf(isBuild)('no missing deps during build', async () => {
  serverLogs.forEach((log) => {
    // no warning from esbuild css minifier
    expect(log).not.toMatch('Missing dependency found after crawling ended')
  })
})

test('name file limit is 170 characters', async () => {
  if (isServe) {
    const response = page.waitForResponse(
      /@vitejs_longfilename-\w+_[a-zA-Z\d]+\.js\?v=[a-zA-Z\d]+/,
    )
    await page.goto(viteTestUrl)
    const content = await response

    const fromUrl = content.url()
    const stripFolderPart = fromUrl.split('/').at(-1)
    const onlyTheFilePart = stripFolderPart.split('.')[0]
    expect(onlyTheFilePart).toHaveLength(170)
  }
})

describe.runIf(isServe)('optimizeDeps config', () => {
  test('supports include glob syntax', () => {
    const metadata = readDepOptimizationMetadata()
    expect(Object.keys(metadata.optimized)).to.include.members([
      '@vitejs/test-dep-optimize-exports-with-glob',
      '@vitejs/test-dep-optimize-exports-with-glob/named',
      '@vitejs/test-dep-optimize-exports-with-glob/glob-dir/foo',
      '@vitejs/test-dep-optimize-exports-with-glob/glob-dir/bar',
      '@vitejs/test-dep-optimize-exports-with-glob/glob-dir/nested/baz',
      '@vitejs/test-dep-optimize-exports-with-root-glob',
      '@vitejs/test-dep-optimize-exports-with-root-glob/file1.js',
      '@vitejs/test-dep-optimize-exports-with-root-glob/index.js',
      '@vitejs/test-dep-optimize-exports-with-root-glob/dir/file2.js',
      '@vitejs/test-dep-optimize-with-glob',
      '@vitejs/test-dep-optimize-with-glob/index.js',
      '@vitejs/test-dep-optimize-with-glob/named.js',
      '@vitejs/test-dep-optimize-with-glob/glob/foo.js',
      '@vitejs/test-dep-optimize-with-glob/glob/bar.js',
      '@vitejs/test-dep-optimize-with-glob/glob/nested/baz.js',
    ])
  })
})

test('long file name should work', async () => {
  await expect
    .poll(() => page.textContent('.long-file-name'))
    .toMatch(`hello world`)
})

test.runIf(isServe)('warn on incompatible dependency', () => {
  expect(serverLogs).toContainEqual(
    expect.stringContaining(
      'The dependency might be incompatible with the dep optimizer.',
    ),
  )
})

test('import the CommonJS external package that omits the js suffix', async () => {
  await expect.poll(() => page.textContent('.external-package-js')).toBe('okay')
  await expect
    .poll(() => page.textContent('.external-package-scss-js'))
    .toBe('scss')
  await expect
    .poll(() => page.textContent('.external-package-astro-js'))
    .toBe('astro')
  await expect
    .poll(() => page.textContent('.external-package-tsx-js'))
    .toBe('tsx')
})

test('external package name with asset extension', async () => {
  await expect
    .poll(() => page.textContent('.dep-with-asset-ext-no-dual-package'))
    .toBe('true')
  await expect
    .poll(() => page.textContent('.dep-with-asset-ext-prebundled'))
    .toBe(String(isServe))
})

test('dependency with external sub-dependencies', async () => {
  await expect
    .poll(() => page.textContent('.dep-cjs-with-external-deps-object'))
    .toBe('ok')
  await expect
    .poll(() => page.textContent('.dep-cjs-with-external-deps-node-builtin'))
    .toBe('foo bar')
})
