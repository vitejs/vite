test('should render', async () => {
  expect(await page.textContent('h1')).toMatch('Hello Vite + React')
})

test('should hmr', () => {})
