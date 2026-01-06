import { execSync, spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { loadEnv } from '../env'
import { isWindows } from '../../shared/utils'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

describe('loadEnv', () => {
  test('basic', () => {
    expect(loadEnv('development', join(__dirname, './env')))
      .toMatchInlineSnapshot(`
        {
          "VITE_APP_BASE_ROUTE": "/",
          "VITE_APP_BASE_URL": "/",
          "VITE_ENV1": "ENV1",
          "VITE_ENV2": "ENV2",
          "VITE_ENV3": "ENV3",
        }
      `)
  })

  test('specific prefix', () => {
    expect(loadEnv('development', join(__dirname, './env'), 'VVITE'))
      .toMatchInlineSnapshot(`
        {
          "VVITE_A": "A",
          "VVITE_B": "B",
        }
      `)
  })

  test('override', () => {
    expect(loadEnv('production', join(__dirname, './env')))
      .toMatchInlineSnapshot(`
        {
          "VITE_APP_BASE_ROUTE": "/app/",
          "VITE_APP_BASE_URL": "/app/",
        }
      `)
  })

  test('override 2', () => {
    expect(loadEnv('development2', join(__dirname, './env')))
      .toMatchInlineSnapshot(`
        {
          "VITE_APP_BASE_ROUTE": "source",
          "VITE_APP_BASE_URL": "source",
          "VITE_SOURCE": "source",
        }
      `)
  })

  test('VITE_USER_NODE_ENV', () => {
    loadEnv('development', join(__dirname, './env'))
    expect(process.env.VITE_USER_NODE_ENV).toEqual(undefined)
  })

  test('VITE_USER_NODE_ENV for dev behaviour in build', () => {
    const _nodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    loadEnv('testing', join(__dirname, './env'))
    expect(process.env.VITE_USER_NODE_ENV).toEqual('development')
    process.env.NODE_ENV = _nodeEnv
  })

  test('Already exists VITE_USER_NODE_ENV', () => {
    process.env.VITE_USER_NODE_ENV = 'test'
    loadEnv('development', join(__dirname, './env'))
    expect(process.env.VITE_USER_NODE_ENV).toEqual('test')
  })

  test('prioritize existing process.env', () => {
    process.env.VITE_ENV_TEST_ENV = 'EXIST'
    expect(loadEnv('existing', join(__dirname, './env')))
      .toMatchInlineSnapshot(`
        {
          "VITE_APP_BASE_ROUTE": "/",
          "VITE_APP_BASE_URL": "/",
          "VITE_ENV_TEST_ENV": "EXIST",
          "VITE_USER_NODE_ENV": "test",
        }
      `)
  })

  test.skipIf(isWindows)('loads env from FIFO (named pipe)', async () => {
    // Create a temporary directory for the test
    const tempDir = await mkdtemp(join(__dirname, './env-fifo-test-'))
    const fifoPath = join(tempDir, '.env')

    try {
      // Create a FIFO (named pipe)
      execSync(`mkfifo "${fifoPath}"`)

      // Write content to the FIFO
      const envContent =
        'VITE_FIFO_TEST=hello_from_fifo\nVITE_ANOTHER_VAR=test_value'
      const writePromise = new Promise<void>((resolve, reject) => {
        const echo = spawn('sh', [
          '-c',
          `echo "${envContent.replace(/"/g, '\\"')}" > "${fifoPath}"`,
        ])
        echo.on('close', (code) => {
          if (code === 0) resolve()
          else reject(new Error(`Write process exited with code ${code}`))
        })
        echo.on('error', reject)
      })

      // Read from FIFO (this will block until data is available)
      // The write process will provide the data
      const readPromise = loadEnv('development', tempDir)

      // Wait for both operations to complete
      const [env] = await Promise.all([readPromise, writePromise])

      // Verify the FIFO content was read correctly
      expect(env).toMatchObject({
        VITE_FIFO_TEST: 'hello_from_fifo',
        VITE_ANOTHER_VAR: 'test_value',
      })
    } finally {
      // Clean up: remove FIFO and temp directory
      try {
        await rm(tempDir, { recursive: true, force: true })
      } catch {
        // Ignore cleanup errors
      }
    }
  })
})
