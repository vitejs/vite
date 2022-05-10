import { editFile, untilUpdated } from '../../testUtils'

test('should render', async () => {
  expect(await page.textContent('h1')).toMatch(
    'Hello Vite + React + @emotion/react'
  )
})

test('should update', async () => {
  expect(await page.textContent('button')).toMatch('count is: 0')
  await page.click('button')
  expect(await page.textContent('button')).toMatch('count is: 1')
})

test('should hmr', async () => {
  editFile('App.jsx', (code) =>
    code.replace('Vite + React + @emotion/react', 'Updated')
  )
  await untilUpdated(() => page.textContent('h1'), 'Hello Updated')
  // preserve state
  expect(await page.textContent('button')).toMatch('count is: 1')
})

test('should update button style', async () => {
  function getButtonBorderStyle() {
    return page.evaluate(() => {
      return window.getComputedStyle(document.querySelector('button')).border
    })
  }

  const styles = await page.evaluate(() => {
    return document.querySelector('button').style
  })

  expect(await getButtonBorderStyle()).toMatch('2px solid rgb(0, 0, 0)')

  editFile('App.jsx', (code) =>
    code.replace('border: 2px solid #000', 'border: 4px solid red')
  )

  await untilUpdated(getButtonBorderStyle, '4px solid rgb(255, 0, 0)')

  // preserve state
  expect(await page.textContent('button')).toMatch('count is: 1')
})
