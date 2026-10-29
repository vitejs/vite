import fs from 'node:fs'
import os from 'node:os'
import { join } from 'node:path'
import { describe, expect, onTestFinished, test } from 'vitest'
import { loadEnv } from '../env'

const dirname = import.meta.dirname

describe('loadEnv', () => {
  test('basic', () => {
    expect(loadEnv('development', join(dirname, './env')))
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
    expect(loadEnv('development', join(dirname, './env'), 'VVITE'))
      .toMatchInlineSnapshot(`
        {
          "VVITE_A": "A",
          "VVITE_B": "B",
        }
      `)
  })

  test('override', () => {
    expect(loadEnv('production', join(dirname, './env')))
      .toMatchInlineSnapshot(`
        {
          "VITE_APP_BASE_ROUTE": "/app/",
          "VITE_APP_BASE_URL": "/app/",
        }
      `)
  })

  test('override 2', () => {
    expect(loadEnv('development2', join(dirname, './env')))
      .toMatchInlineSnapshot(`
        {
          "VITE_APP_BASE_ROUTE": "source",
          "VITE_APP_BASE_URL": "source",
          "VITE_SOURCE": "source",
        }
      `)
  })

  test('VITE_USER_NODE_ENV', () => {
    loadEnv('development', join(dirname, './env'))
    expect(process.env.VITE_USER_NODE_ENV).toEqual(undefined)
  })

  test('VITE_USER_NODE_ENV for dev behaviour in build', () => {
    const _nodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    loadEnv('testing', join(dirname, './env'))
    expect(process.env.VITE_USER_NODE_ENV).toEqual('development')
    process.env.NODE_ENV = _nodeEnv
  })

  test('Already exists VITE_USER_NODE_ENV', () => {
    process.env.VITE_USER_NODE_ENV = 'test'
    loadEnv('development', join(dirname, './env'))
    expect(process.env.VITE_USER_NODE_ENV).toEqual('test')
  })

  test('prioritize existing process.env', () => {
    process.env.VITE_ENV_TEST_ENV = 'EXIST'
    expect(loadEnv('existing', join(dirname, './env'))).toMatchInlineSnapshot(`
        {
          "VITE_APP_BASE_ROUTE": "/",
          "VITE_APP_BASE_URL": "/",
          "VITE_ENV_TEST_ENV": "EXIST",
          "VITE_USER_NODE_ENV": "test",
        }
      `)
  })

  test('UTF-8 BOM', () => {
    const dir = fs.mkdtempSync(join(os.tmpdir(), 'vite-env-'))
    onTestFinished(() => fs.rmSync(dir, { recursive: true, force: true }))
    fs.writeFileSync(join(dir, '.env'), '\uFEFFVITE_BOM_A=a\nVITE_BOM_B=b\n')
    expect(loadEnv('bom', dir)).toMatchObject({
      VITE_BOM_A: 'a',
      VITE_BOM_B: 'b',
    })
  })
})
