import { expect, test } from 'vitest'
import {
  editFile,
  isBuild,
  isServe,
  page,
  untilBrowserLogAfter,
  untilUpdated
} from '~utils'

test('should render', async () => {
  expect(await page.textContent('h1')).toMatch('Hello Vite + React')
})

test('should update', async () => {
  expect(await page.textContent('#state-button')).toMatch('count is: 0')
  await page.click('#state-button')
  expect(await page.textContent('#state-button')).toMatch('count is: 1')
})

test('should hmr', async () => {
  editFile('App.jsx', (code) => code.replace('Vite + React', 'Updated'))
  await untilUpdated(() => page.textContent('h1'), 'Hello Updated')
  // preserve state
  expect(await page.textContent('#state-button')).toMatch('count is: 1')
})

test.runIf(isServe)(
  'should have annotated jsx with file location metadata',
  async () => {
    const meta = await page.evaluate(() => {
      const button = document.querySelector('#state-button')
      const key = Object.keys(button).find(
        (key) => key.indexOf('__reactFiber') === 0
      )
      return button[key]._debugSource
    })
    // If the evaluate call doesn't crash, and the returned metadata has
    // the expected fields, we're good.
    expect(Object.keys(meta).sort()).toEqual([
      'columnNumber',
      'fileName',
      'lineNumber'
    ])
  }
)

if (!isBuild) {
  // #9869
  test('should only hmr files with exported react components', async () => {
    await untilBrowserLogAfter(
      () =>
        editFile('hmr/no-exported-comp.jsx', (code) =>
          code.replace('An Object', 'Updated')
        ),
      [
        '[vite] invalidate /hmr/no-exported-comp.jsx',
        '[vite] hot updated: /hmr/no-exported-comp.jsx',
        '[vite] hot updated: /hmr/parent.jsx',
        'Parent rendered'
      ],
      true
    )
    await untilUpdated(() => page.textContent('#parent'), 'Updated')
  })

  // #3301
  test('should hmr react context', async () => {
    expect(await page.textContent('#context-button')).toMatch(
      'context-based count is: 0'
    )
    await page.click('#context-button')
    expect(await page.textContent('#context-button')).toMatch(
      'context-based count is: 1'
    )

    await untilBrowserLogAfter(
      () =>
        editFile('context/CountProvider.jsx', (code) =>
          code.replace('context provider', 'context provider updated')
        ),
      [
        '[vite] invalidate /context/CountProvider.jsx',
        '[vite] hot updated: /context/CountProvider.jsx',
        '[vite] hot updated: /App.jsx',
        '[vite] hot updated: /context/ContextButton.jsx',
        'Parent rendered'
      ],
      true
    )
    await untilUpdated(
      () => page.textContent('#context-provider'),
      'context provider updated'
    )
  })
}
