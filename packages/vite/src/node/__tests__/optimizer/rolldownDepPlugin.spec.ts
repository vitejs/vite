import { describe, expect, it } from 'vitest'
import { rolldownDepPlugin } from '../../optimizer/rolldownDepPlugin'

describe('rolldownDepPlugin transform', () => {
  const createMockEnv = (cacheDir: string) =>
    ({
      config: {
        cacheDir,
        optimizeDeps: { extensions: [] },
        server: { fs: { allow: [] } },
        resolve: { builtins: [] },
      },
      getTopLevelConfig: () => ({
        createResolver: () => ({}),
      }),
    }) as any

  const getTransformHandler = (env: any) => {
    const plugins = rolldownDepPlugin(env, {}, [])

    const plugin = plugins.find(
      (p: any) => p.name === 'vite:dep-pre-bundle',
    ) as any

    if (!plugin || !plugin.transform) {
      throw new Error(
        'Could not find the vite:dep-pre-bundle plugin or its transform hook',
      )
    }

    return plugin.transform.handler
  }

  it('returns null if id is not in node_modules', async () => {
    const env = createMockEnv('/root/node_modules/.vite')
    const handler = getTransformHandler(env)

    const id = '/root/src/main.js'
    const code = `new URL('./worker.js', import.meta.url)`

    const result = await handler.call({}, code, id)
    expect(result).toBeNull()
  })

  it('returns null if code contains new URL but no worker pattern', async () => {
    const env = createMockEnv('/root/node_modules/.vite')
    const handler = getTransformHandler(env)

    const id = '/root/node_modules/my-lib/index.js'
    const code = `const img = new URL('./logo.png', import.meta.url).href`

    const result = await handler.call({}, code, id)
    expect(result).toBeNull()
  })

  it('rebases a single worker URL correctly', async () => {
    const env = createMockEnv('/root/node_modules/.vite')
    const handler = getTransformHandler(env)

    const id = '/root/node_modules/my-lib/dist/index.js'
    const code = `const w = new Worker(new URL('./worker.js', import.meta.url))`

    const result = await handler.call({}, code, id)

    // Path jump from .vite/deps to my-lib/dist/worker.js
    expect(result.code).toContain(
      'new URL(\'\' + "../../my-lib/dist/worker.js"',
    )
    expect(result.map).toBeDefined()
  })

  it('handles multiple workers in a single file', async () => {
    const env = createMockEnv('/root/node_modules/.vite')
    const handler = getTransformHandler(env)

    const id = '/root/node_modules/my-lib/dist/index.js'
    const code = `
      const w1 = new Worker(new URL('./w1.js', import.meta.url))
      const w2 = new Worker(new URL('./nested/w2.js', import.meta.url))
    `

    const result = await handler.call({}, code, id)

    expect(result.code).toContain('"../../my-lib/dist/w1.js"')
    expect(result.code).toContain('"../../my-lib/dist/nested/w2.js"')
  })

  it('handles workers with single and double quotes', async () => {
    const env = createMockEnv('/root/node_modules/.vite')
    const handler = getTransformHandler(env)
    const id = '/root/node_modules/my-lib/index.js'

    const code = `
      new Worker(new URL('./a.js', import.meta.url))
      new SharedWorker(new URL("./b.js", import.meta.url))
    `
    const result = await handler.call({}, code, id)

    expect(result.code).toContain('"../../my-lib/a.js"')
    expect(result.code).toContain('"../../my-lib/b.js"')
  })
})
