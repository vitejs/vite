import { expect, test } from 'vitest'
import {
  editFile,
  getBg,
  getColor,
  isBuild,
  page,
  untilUpdated,
  viteTestUrl,
} from '~utils'

export const sassTest = () => {
  test('sass', async () => {
    const imported = await page.$('.sass')
    const atImport = await page.$('.sass-at-import')
    const atImportAlias = await page.$('.sass-at-import-alias')
    const urlStartsWithVariable = await page.$('.sass-url-starts-with-variable')
    const urlStartsWithFunctionCall = await page.$(
      '.sass-url-starts-with-function-call',
    )
    const partialImport = await page.$('.sass-partial')

    expect(await getColor(imported)).toBe('orange')
    expect(await getColor(atImport)).toBe('olive')
    expect(await getBg(atImport)).toMatch(
      isBuild ? /base64/ : '/nested/icon.png',
    )
    expect(await getColor(atImportAlias)).toBe('olive')
    expect(await getBg(atImportAlias)).toMatch(
      isBuild ? /base64/ : '/nested/icon.png',
    )
    expect(await getBg(urlStartsWithVariable)).toMatch(
      isBuild ? /ok-[-\w]+\.png/ : `${viteTestUrl}/ok.png`,
    )
    expect(await getBg(urlStartsWithFunctionCall)).toMatch(
      isBuild ? /ok-[-\w]+\.png/ : `${viteTestUrl}/ok.png`,
    )
    expect(await getColor(partialImport)).toBe('orchid')
    expect(await getColor(await page.$('.sass-file-absolute'))).toBe('orange')
    expect(await getColor(await page.$('.sass-dir-index'))).toBe('orange')
    expect(await getColor(await page.$('.sass-root-relative'))).toBe('orange')

    if (isBuild) return

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
}

export const sassModuleTests = (enableHmrTests = false) => {
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

  test('css modules w/ sass', async () => {
    const imported = await page.$('.modules-sass')
    expect(await getColor(imported)).toBe('orangered')
    expect(await imported.getAttribute('class')).toMatch(
      /.mod-module__apply-color___[\w-]{5}/,
    )

    if (isBuild) return

    editFile('mod.module.scss', (code) =>
      code.replace('color: orangered', 'color: blue'),
    )
    await untilUpdated(() => getColor(imported), 'blue')
  })
}

export const sassOtherTests = () => {
  test('@import dependency w/ sass entry', async () => {
    expect(await getColor('.css-dep-sass')).toBe('orange')
  })

  test('@import dependency w/ sass export mapping', async () => {
    expect(await getColor('.css-dep-exports-sass')).toBe('orange')
  })

  test('@import dependency w/out package scss', async () => {
    expect(await getColor('.sass-dep')).toBe('lavender')
  })
}
