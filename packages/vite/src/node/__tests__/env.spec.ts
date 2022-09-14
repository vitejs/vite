import { posix } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { loadEnv } from '../env'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

describe('loadEnv', () => {
  test('basic', async () => {
    expect(loadEnv('development', posix.join(__dirname, './env')))
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

  test('specific prefix', async () => {
    expect(loadEnv('development', posix.join(__dirname, './env'), 'VVITE'))
      .toMatchInlineSnapshot(`
        {
          "VVITE_A": "A",
          "VVITE_B": "B",
        }
      `)
  })

  test('override', async () => {
    expect(loadEnv('production', posix.join(__dirname, './env')))
      .toMatchInlineSnapshot(`
        {
          "VITE_APP_BASE_ROUTE": "/app/",
          "VITE_APP_BASE_URL": "/app/",
          "VITE_USER_NODE_ENV": "production",
        }
      `)
  })

  test('VITE_USER_NODE_ENV', async () => {
    loadEnv('development', posix.join(__dirname, './env'))
    expect(process.env.VITE_USER_NODE_ENV).toEqual('production')
  })

  test('Already exists VITE_USER_NODE_ENV', async () => {
    process.env.VITE_USER_NODE_ENV = 'test'
    loadEnv('development', posix.join(__dirname, './env'))
    expect(process.env.VITE_USER_NODE_ENV).toEqual('test')
  })
})
