import { getColor } from '../../testUtils'
import { createServer } from 'vite'
import path from 'path'

test('postcss config', async () => {
  const port = 5005
  const blueAppDir = path.join(__dirname, 'blue-app')
  const greenAppDir = path.join(__dirname, 'green-app')

  process.chdir(blueAppDir)
  const blueApp = await createServer()
  await blueApp.listen(port)
  await page.goto(`http://localhost:${port}`)
  const blueA = await page.$('.postcss-a')
  expect(await getColor(blueA)).toBe('blue')
  const blueB = await page.$('.postcss-b')
  expect(await getColor(blueB)).toBe('black')
  await blueApp.close()

  process.chdir(greenAppDir)
  const greenApp = await createServer()
  await greenApp.listen(port)
  await page.goto(`http://localhost:${port}`)
  const greenA = await page.$('.postcss-a')
  expect(await getColor(greenA)).toBe('black')
  const greenB = await page.$('.postcss-b')
  expect(await getColor(greenB)).toBe('green')
  await greenApp.close()
})
