test('handle nested package', async () => {
  expect(await page.textContent('.a')).toBe('A@2.0.0')
  expect(await page.textContent('.b')).toBe('B@1.0.0')
  expect(await page.textContent('.nested-a')).toBe('A@1.0.0')
})
