import { isBuild } from 'testUtils'

if (isBuild) {
  test('should not output sourcemap warning (#4939)', () => {
    serverLogs.forEach((log) => {
      expect(log).not.toMatch('Sourcemap is likely to be incorrect')
    })
  })
} else {
  test('this file only includes test for build', () => {
    expect(true).toBe(true)
  })
}
