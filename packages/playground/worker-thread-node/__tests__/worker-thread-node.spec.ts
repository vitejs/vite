import { run } from '../dist/main.cjs'
import { isBuild } from '../../testUtils'

if (isBuild) {
  test('should return result from worker thread', async () => {
    const a = await run('ping')
    expect(a).toBe('pong')
  })
}
