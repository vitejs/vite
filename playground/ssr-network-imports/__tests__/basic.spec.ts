import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { test } from 'vitest'
import { isServe } from '~utils'

const execFileAsync = promisify(execFile)

test.runIf(isServe)('basic', async () => {
  await execFileAsync('node', ['--experimental-network-imports', 'test.js'], {
    cwd: new URL('..', import.meta.url).pathname,
  })
})
