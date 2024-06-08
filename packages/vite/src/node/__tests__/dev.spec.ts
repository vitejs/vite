import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { describe, expect, onTestFinished, test } from 'vitest'
import { createServer, createServerModuleRunner, resolveConfig } from '..'

describe('resolveBuildEnvironmentOptions in dev', () => {
  test('build.rollupOptions should not have input in lib', async () => {
    const config = await resolveConfig(
      {
        build: {
          lib: {
            entry: './index.js',
          },
        },
      },
      'serve',
    )

    expect(config.build.rollupOptions).not.toHaveProperty('input')
  })
})

test('runner dynamic import', async () => {
  const root = fileURLToPath(
    new URL('./fixtures/runner-import', import.meta.url),
  )
  const server = await createServer({
    clearScreen: false,
    configFile: false,
    root,
    environments: {
      custom: {},
    },
  })
  onTestFinished(async () => {
    await server.close()
  })

  const environment = server.environments.custom
  const runner = createServerModuleRunner(environment)

  const { getDep, customImport } = await runner.import('/entry.js')
  const mod = await customImport(path.join(root, 'dep.js'))
  expect(mod.dep).toBe(getDep())
})
