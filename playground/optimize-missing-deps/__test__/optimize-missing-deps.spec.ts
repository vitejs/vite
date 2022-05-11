import { port } from './serve'
import fetch from 'node-fetch'
import { page, untilUpdated } from '~utils'
import { platform } from 'os'

const url = `http://localhost:${port}/`

// TODO: on macOS this test causing the process exists for some reason
test.skipIf(platform() === 'darwin')('optimize', async () => {
  await page.goto(url)
  // reload page to get optimized missing deps
  await page.reload()
  await untilUpdated(() => page.textContent('div'), 'Client')

  // raw http request
  const aboutHtml = await (await fetch(url)).text()
  expect(aboutHtml).toContain('Server')
})
