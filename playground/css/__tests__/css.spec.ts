import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import {
  editFile,
  findAssetFile,
  getBg,
  getColor,
  isBuild,
  isServe,
  page,
  removeFile,
  serverLogs,
  untilUpdated,
  viteTestUrl,
  withRetry,
} from '~utils'

// note: tests should retrieve the element at the beginning of test and reuse it
// in later assertions to ensure CSS HMR doesn't reload the page
test('imported css', async () => {
  const glob = await page.textContent('.imported-css-glob')
  expect(glob).toContain('.dir-import')
  const globEager = await page.textContent('.imported-css-globEager')
  expect(globEager).toContain('.dir-import')
})

test('inline imported css', async () => {
  const css = await page.textContent('.imported-css')
  expect(css).toMatch(/\.imported ?\{/)
  if (isBuild) {
    expect(css.trim()).not.toContain('\n') // check minified
  }
})

test('linked css', async () => {
  const linked = await page.$('.linked')
  const atImport = await page.$('.linked-at-import')

  expect(await getColor(linked)).toBe('blue')
  expect(await getColor(atImport)).toBe('red')

  editFile('linked.css', (code) => code.replace('color: blue', 'color: red'))
  await untilUpdated(() => getColor(linked), 'red')

  editFile('linked-at-import.css', (code) =>
    code.replace('color: red', 'color: blue'),
  )
  await untilUpdated(() => getColor(atImport), 'blue')
})

test('css import from js', async () => {
  const imported = await page.$('.imported')
  const atImport = await page.$('.imported-at-import')

  expect(await getColor(imported)).toBe('green')
  expect(await getColor(atImport)).toBe('purple')

  editFile('imported.css', (code) => code.replace('color: green', 'color: red'))
  await untilUpdated(() => getColor(imported), 'red')

  editFile('imported-at-import.css', (code) =>
    code.replace('color: purple', 'color: blue'),
  )
  await untilUpdated(() => getColor(atImport), 'blue')
})

test('css import asset with space', async () => {
  const importedWithSpace = await page.$('.import-with-space')

  expect(await getBg(importedWithSpace)).toMatch(/.*\/ok.*\.png/)
})

test('postcss config', async () => {
  const imported = await page.$('.postcss .nesting')
  expect(await getColor(imported)).toBe('pink')

  editFile('imported.css', (code) => code.replace('color: pink', 'color: red'))
  await untilUpdated(() => getColor(imported), 'red')
})

test('sass', async () => {
  const imported = await page.$('.sass')
  const atImport = await page.$('.sass-at-import')
  const atImportAlias = await page.$('.sass-at-import-alias')
  const urlStartsWithVariable = await page.$('.sass-url-starts-with-variable')
  const partialImport = await page.$('.sass-partial')

  expect(await getColor(imported)).toBe('orange')
  expect(await getColor(atImport)).toBe('olive')
  expect(await getBg(atImport)).toMatch(isBuild ? /base64/ : '/nested/icon.png')
  expect(await getColor(atImportAlias)).toBe('olive')
  expect(await getBg(atImportAlias)).toMatch(
    isBuild ? /base64/ : '/nested/icon.png',
  )
  expect(await getBg(urlStartsWithVariable)).toMatch(
    isBuild ? /ok-\w+\.png/ : `${viteTestUrl}/ok.png`,
  )
  expect(await getColor(partialImport)).toBe('orchid')

  editFile('sass.scss', (code) =>
    code.replace('color: $injectedColor', 'color: red'),
  )
  await untilUpdated(() => getColor(imported), 'red')

  editFile('nested/_index.scss', (code) =>
    code.replace('color: olive', 'color: blue'),
  )
  await untilUpdated(() => getColor(atImport), 'blue')

  editFile('nested/_partial.scss', (code) =>
    code.replace('color: orchid', 'color: green'),
  )
  await untilUpdated(() => getColor(partialImport), 'green')
})

test('less', async () => {
  const imported = await page.$('.less')
  const atImport = await page.$('.less-at-import')
  const atImportAlias = await page.$('.less-at-import-alias')
  const urlStartsWithVariable = await page.$('.less-url-starts-with-variable')

  expect(await getColor(imported)).toBe('blue')
  expect(await getColor(atImport)).toBe('darkslateblue')
  expect(await getBg(atImport)).toMatch(isBuild ? /base64/ : '/nested/icon.png')
  expect(await getColor(atImportAlias)).toBe('darkslateblue')
  expect(await getBg(atImportAlias)).toMatch(
    isBuild ? /base64/ : '/nested/icon.png',
  )
  expect(await getBg(urlStartsWithVariable)).toMatch(
    isBuild ? /ok-\w+\.png/ : `${viteTestUrl}/ok.png`,
  )

  editFile('less.less', (code) => code.replace('@color: blue', '@color: red'))
  await untilUpdated(() => getColor(imported), 'red')

  editFile('nested/nested.less', (code) =>
    code.replace('color: darkslateblue', 'color: blue'),
  )
  await untilUpdated(() => getColor(atImport), 'blue')
})

test('stylus', async () => {
  const imported = await page.$('.stylus')
  const additionalData = await page.$('.stylus-additional-data')
  const relativeImport = await page.$('.stylus-import')
  const relativeImportAlias = await page.$('.stylus-import-alias')
  const optionsRelativeImport = await page.$('.stylus-options-relative-import')
  const optionsAbsoluteImport = await page.$('.stylus-options-absolute-import')

  expect(await getColor(imported)).toBe('blue')
  expect(await getColor(additionalData)).toBe('orange')
  expect(await getColor(relativeImport)).toBe('darkslateblue')
  expect(await getColor(relativeImportAlias)).toBe('darkslateblue')
  expect(await getBg(relativeImportAlias)).toMatch(
    isBuild ? /base64/ : '/nested/icon.png',
  )
  expect(await getColor(optionsRelativeImport)).toBe('green')
  expect(await getColor(optionsAbsoluteImport)).toBe('red')

  editFile('stylus.styl', (code) =>
    code.replace('$color ?= blue', '$color ?= red'),
  )
  await untilUpdated(() => getColor(imported), 'red')

  editFile('nested/nested.styl', (code) =>
    code.replace('color: darkslateblue', 'color: blue'),
  )
  await untilUpdated(() => getColor(relativeImport), 'blue')
})

test('css modules', async () => {
  const imported = await page.$('.modules')
  expect(await getColor(imported)).toBe('turquoise')

  // check if the generated CSS module class name is indeed using the
  // format specified in vite.config.js
  expect(await imported.getAttribute('class')).toMatch(
    /.mod-module__apply-color___[\w-]{5}/,
  )

  editFile('mod.module.css', (code) =>
    code.replace('color: turquoise', 'color: red'),
  )
  await untilUpdated(() => getColor(imported), 'red')
})

test('css modules composes/from path resolving', async () => {
  const imported = await page.$('.path-resolved-modules-css')
  expect(await getColor(imported)).toBe('turquoise')

  // check if the generated CSS module class name is indeed using the
  // format specified in vite.config.js
  expect(await imported.getAttribute('class')).toMatch(
    /.composed-module__apply-color___[\w-]{5}/,
  )

  expect(await imported.getAttribute('class')).toMatch(
    /.composes-path-resolving-module__path-resolving-css___[\w-]{5}/,
  )

  // @todo HMR is not working on this situation.
  // editFile('composed.module.css', (code) =>
  //   code.replace('color: turquoise', 'color: red')
  // )
  // await untilUpdated(() => getColor(imported), 'red')
})

test('sass modules composes/from path resolving', async () => {
  const imported = await page.$('.path-resolved-modules-sass')
  expect(await getColor(imported)).toBe('orangered')

  // check if the generated CSS module class name is indeed using the
  // format specified in vite.config.js
  expect(await imported.getAttribute('class')).toMatch(
    /.composed-module__apply-color___[\w-]{5}/,
  )

  expect(await imported.getAttribute('class')).toMatch(
    /.composes-path-resolving-module__path-resolving-sass___[\w-]{5}/,
  )

  // @todo HMR is not working on this situation.
  // editFile('composed.module.scss', (code) =>
  //   code.replace('color: orangered', 'color: red')
  // )
  // await untilUpdated(() => getColor(imported), 'red')
})

test('less modules composes/from path resolving', async () => {
  const imported = await page.$('.path-resolved-modules-less')
  expect(await getColor(imported)).toBe('blue')

  // check if the generated CSS module class name is indeed using the
  // format specified in vite.config.js
  expect(await imported.getAttribute('class')).toMatch(
    /.composed-module__apply-color___[\w-]{5}/,
  )

  expect(await imported.getAttribute('class')).toMatch(
    /.composes-path-resolving-module__path-resolving-less___[\w-]{5}/,
  )

  // @todo HMR is not working on this situation.
  // editFile('composed.module.scss', (code) =>
  //   code.replace('color: orangered', 'color: red')
  // )
  // await untilUpdated(() => getColor(imported), 'red')
})

test('css modules w/ sass', async () => {
  const imported = await page.$('.modules-sass')
  expect(await getColor(imported)).toBe('orangered')
  expect(await imported.getAttribute('class')).toMatch(
    /.mod-module__apply-color___[\w-]{5}/,
  )

  editFile('mod.module.scss', (code) =>
    code.replace('color: orangered', 'color: blue'),
  )
  await untilUpdated(() => getColor(imported), 'blue')
})

test('inline css modules', async () => {
  const css = await page.textContent('.modules-inline')
  expect(css).toMatch(/\.inline-module__apply-color-inline___[\w-]{5}/)
})

test.runIf(isBuild)('@charset hoist', async () => {
  serverLogs.forEach((log) => {
    // no warning from esbuild css minifier
    expect(log).not.toMatch('"@charset" must be the first rule in the file')
  })
})

test('layers', async () => {
  expect(await getColor('.layers-blue')).toMatch('blue')
  expect(await getColor('.layers-green')).toMatch('green')
})

test('@import dependency w/ style entry', async () => {
  expect(await getColor('.css-dep')).toBe('purple')
})

test('@import dependency w/ sass entry', async () => {
  expect(await getColor('.css-dep-sass')).toBe('orange')
})

test('@import dependency w/out package scss', async () => {
  expect(await getColor('.sass-dep')).toBe('lavender')
})

test('async chunk', async () => {
  const el = await page.$('.async')
  expect(await getColor(el)).toBe('teal')

  if (isBuild) {
    // assert that the css is extracted into its own file instead of in the
    // main css file
    expect(findAssetFile(/index-\w+\.css$/)).not.toMatch('teal')
    expect(findAssetFile(/async-\w+\.css$/)).toMatch('.async{color:teal}')
  } else {
    // test hmr
    editFile('async.css', (code) => code.replace('color: teal', 'color: blue'))
    await untilUpdated(() => getColor(el), 'blue')
  }
})

test('treeshaken async chunk', async () => {
  if (isBuild) {
    // should be absent in prod
    expect(
      await page.evaluate(() => {
        return document.querySelector('.async-treeshaken')
      }),
    ).toBeNull()
    // assert that the css is not present anywhere
    expect(findAssetFile(/\.css$/)).not.toMatch('plum')
    expect(findAssetFile(/index-\w+\.js$/)).not.toMatch('.async{color:plum}')
    expect(findAssetFile(/async-\w+\.js$/)).not.toMatch('.async{color:plum}')
    // should have no chunk!
    expect(findAssetFile(/async-treeshaken/)).toBe('')
  } else {
    // should be present in dev
    const el = await page.$('.async-treeshaken')
    editFile('async-treeshaken.css', (code) =>
      code.replace('color: plum', 'color: blue'),
    )
    await untilUpdated(() => getColor(el), 'blue')
  }
})

test('PostCSS dir-dependency', async () => {
  const el1 = await page.$('.dir-dep')
  const el2 = await page.$('.dir-dep-2')
  const el3 = await page.$('.dir-dep-3')

  expect(await getColor(el1)).toBe('grey')
  expect(await getColor(el2)).toBe('grey')
  expect(await getColor(el3)).toBe('grey')

  if (!isBuild) {
    editFile('glob-dep/foo.css', (code) =>
      code.replace('color: grey', 'color: blue'),
    )
    await untilUpdated(() => getColor(el1), 'blue')
    expect(await getColor(el2)).toBe('grey')

    editFile('glob-dep/bar.css', (code) =>
      code.replace('color: grey', 'color: red'),
    )
    await untilUpdated(() => getColor(el2), 'red')
    expect(await getColor(el1)).toBe('blue')

    editFile('glob-dep/nested (dir)/baz.css', (code) =>
      code.replace('color: grey', 'color: green'),
    )
    await untilUpdated(() => getColor(el3), 'green')
    expect(await getColor(el1)).toBe('blue')
    expect(await getColor(el2)).toBe('red')

    // test add/remove
    removeFile('glob-dep/bar.css')
    await untilUpdated(() => getColor(el2), 'black')
  }
})

test('import dependency includes css import', async () => {
  expect(await getColor('.css-js-dep')).toBe('green')
  expect(await getColor('.css-js-dep-module')).toBe('green')
})

test('URL separation', async () => {
  const urlSeparated = await page.$('.url-separated')
  const baseUrl = 'url(images/dog.webp)'
  const cases = new Array(5)
    .fill('')
    .flatMap((_, i) =>
      [',', ' ,', ', ', ' , '].map(
        (sep) =>
          `background-image:${new Array(i + 1).fill(baseUrl).join(sep)};`,
      ),
    )

  // Insert the base case
  cases.unshift('background-image:url(images/cat.webp),url(images/dog.webp)')

  for (const [c, i] of cases.map((c, i) => [c, i]) as [string, number][]) {
    // Replace the previous case
    if (i > 0) editFile('imported.css', (code) => code.replace(cases[i - 1], c))

    expect(await getBg(urlSeparated)).toMatch(
      /^url\(.+\)(?:\s*,\s*url\(.+\))*$/,
    )
  }
})

test('inlined', async () => {
  // should not insert css
  expect(await getColor('.inlined')).toBe('black')
})

test('inlined-code', async () => {
  const code = await page.textContent('.inlined-code')
  // should resolve assets
  expect(code).toContain('background:')
  expect(code).not.toContain('__VITE_ASSET__')

  if (isBuild) {
    expect(code.trim()).not.toContain('\n') // check minified
  }
})

test('minify css', async () => {
  if (!isBuild) {
    return
  }

  // should keep the rgba() syntax
  const cssFile = findAssetFile(/index-\w+\.css$/)
  expect(cssFile).toMatch('rgba(')
  expect(cssFile).not.toMatch('#ffff00b3')
})

test('?raw', async () => {
  const rawImportCss = await page.$('.raw-imported-css')

  expect(await rawImportCss.textContent()).toBe(
    readFileSync(require.resolve('../raw-imported.css'), 'utf-8'),
  )
})

test('import css in less', async () => {
  expect(await getColor('.css-in-less')).toBe('yellow')
  expect(await getColor('.css-in-less-2')).toBe('blue')
})

test("relative path rewritten in Less's data-uri", async () => {
  // relative path passed to Less's data-uri is rewritten to absolute,
  // the Less inlines it
  expect(await getBg('.form-box-data-uri')).toMatch(
    /^url\("data:image\/svg\+xml,%3Csvg/,
  )
})

test('PostCSS source.input.from includes query', async () => {
  const code = await page.textContent('.postcss-source-input')
  // should resolve assets
  expect(code).toContain(
    isBuild
      ? '/postcss-source-input.css?used&query=foo'
      : '/postcss-source-input.css?query=foo',
  )
})

describe.runIf(isServe)('deprecate default/named imports from CSS', () => {
  test('css file', () => {
    const actual = serverLogs.some((log) =>
      /Use the \?inline query instead.+imported\.css/.test(log),
    )
    expect(actual).toBe(true)
  })

  test('js file ending with .css.js', async () => {
    const message = await page.textContent('.jsfile-css-js')
    expect(message).toMatch('from jsfile.css.js')
    serverLogs.forEach((log) => {
      expect(log).not.toMatch(/Use the \?inline query instead.+jsfile\.css/)
    })
  })
})

test('aliased css has content', async () => {
  expect(await getColor('.aliased')).toBe('blue')
  // skipped: currently not supported see #8936
  // expect(await page.textContent('.aliased-content')).toMatch('.aliased')
  expect(await getColor('.aliased-module')).toBe('blue')
})

test.runIf(isBuild)('warning can be suppressed by esbuild.logOverride', () => {
  serverLogs.forEach((log) => {
    // no warning from esbuild css minifier
    expect(log).not.toMatch('unsupported-css-property')
  })
})

test('sugarss', async () => {
  const imported = await page.$('.sugarss')
  const atImport = await page.$('.sugarss-at-import')
  const atImportAlias = await page.$('.sugarss-at-import-alias')

  expect(await getColor(imported)).toBe('blue')
  expect(await getColor(atImport)).toBe('darkslateblue')
  expect(await getBg(atImport)).toMatch(isBuild ? /base64/ : '/nested/icon.png')
  expect(await getColor(atImportAlias)).toBe('darkslateblue')
  expect(await getBg(atImportAlias)).toMatch(
    isBuild ? /base64/ : '/nested/icon.png',
  )

  editFile('sugarss.sss', (code) => code.replace('color: blue', 'color: coral'))
  await untilUpdated(() => getColor(imported), 'coral')

  editFile('nested/nested.sss', (code) =>
    code.replace('color: darkslateblue', 'color: blue'),
  )
  await untilUpdated(() => getColor(atImport), 'blue')
})

// NOTE: the match inline snapshot should generate by build mode
test('async css order', async () => {
  await withRetry(async () => {
    expect(await getColor('.async-green')).toMatchInlineSnapshot('"green"')
    expect(await getColor('.async-blue')).toMatchInlineSnapshot('"blue"')
  }, true)
})

test('async css order with css modules', async () => {
  await withRetry(async () => {
    expect(await getColor('.modules-pink')).toMatchInlineSnapshot('"pink"')
  }, true)
})
