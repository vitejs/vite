import { expect, test } from 'vitest'
import { browserLogs, editFile, isServe, page, untilUpdated } from '~utils'

test('should render', async () => {
  expect(await page.textContent('h1')).toMatch('Hello Vite + React')
})

test('should update', async () => {
  expect(await page.textContent('button')).toMatch('count is: 0')
  await page.click('button')
  expect(await page.textContent('button')).toMatch('count is: 1')
})

test('should hmr', async () => {
  editFile('App.jsx', (code) => code.replace('Vite + React', 'Updated'))
  await untilUpdated(() => page.textContent('h1'), 'Hello Updated')
  // preserve state
  expect(await page.textContent('button')).toMatch('count is: 1')
})

// #9869
test('should only hmr files with exported react components', async () => {
  browserLogs.length = 0
  editFile('hmr/no-exported-comp.jsx', (code) =>
    code.replace('An Object', 'Updated')
  )
  await untilUpdated(() => page.textContent('#parent'), 'Updated')
  expect(browserLogs).toMatchObject([
    '[vite] hot updated: /hmr/parent.jsx',
    'Parent rendered'
  ])
})

test.runIf(isServe)(
  'should have annotated jsx with file location metadata',
  async () => {
    const meta = await page.evaluate(() => {
      const button = document.querySelector('button')
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
