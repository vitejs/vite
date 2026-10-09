import { expect, test } from 'vitest'
import { page } from '~utils'

test('renders text, json, and jsx moduleTypes correctly', async () => {
  const text = await page.innerHTML('#app')
  expect(text).toContain('label: This is some label text')
  expect(text).toContain('data: world')
  expect(text).toContain('jsx: <div id="jsx-root"><div>hello</div></div>')
})
