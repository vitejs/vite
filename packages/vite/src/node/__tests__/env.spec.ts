import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { loadEnv } from '../env'

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
})
