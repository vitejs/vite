test('should have no 404s', () => {
  browserLogs.forEach((msg) => {
    expect(msg).not.toMatch('404')
  })
})

test('not-preserve-symlinks', async () => {
  expect(await page.textContent('#root')).toBe('hello vite')
})
