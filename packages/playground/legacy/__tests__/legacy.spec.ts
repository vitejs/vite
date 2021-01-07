test('should work', async () => {
  expect(await page.textContent('#app')).toMatch('Hello')
})
