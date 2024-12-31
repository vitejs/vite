import { describe, expect, test } from 'vitest'
import { parseAst } from 'rollup/parseAst'
import { workerImportMetaUrlPlugin } from '../../plugins/workerImportMetaUrl'
import { resolveConfig } from '../../config'
import { PartialEnvironment } from '../../baseEnvironment'

async function createWorkerImportMetaUrlPluginTransform() {
  const config = await resolveConfig({ configFile: false }, 'serve')
  const instance = workerImportMetaUrlPlugin(config)
  const environment = new PartialEnvironment('client', config)

  return async (code: string) => {
    // @ts-expect-error transform should exist
    const result = await instance.transform.call(
      { environment, parse: parseAst },
      code,
      'foo.ts',
    )
    return result?.code || result
  }
}

describe('workerImportMetaUrlPlugin', async () => {
  const transform = await createWorkerImportMetaUrlPluginTransform()

  test('without worker options', async () => {
    expect(
      await transform('new Worker(new URL("./worker.js", import.meta.url))'),
    ).toMatchInlineSnapshot(
      `"new Worker(new URL(/* @vite-ignore */ "/worker.js?worker_file&type=classic", import.meta.url))"`,
    )
  })

  test('with shared worker', async () => {
    expect(
      await transform(
        'new SharedWorker(new URL("./worker.js", import.meta.url))',
      ),
    ).toMatchInlineSnapshot(
      `"new SharedWorker(new URL(/* @vite-ignore */ "/worker.js?worker_file&type=classic", import.meta.url))"`,
    )
  })

  test('with static worker options and identifier properties', async () => {
    expect(
      await transform(
        'new Worker(new URL("./worker.js", import.meta.url), { type: "module", name: "worker1" })',
      ),
    ).toMatchInlineSnapshot(
      `"new Worker(new URL(/* @vite-ignore */ "/worker.js?worker_file&type=module", import.meta.url), { type: "module", name: "worker1" })"`,
    )
  })

  test('with static worker options and literal properties', async () => {
    expect(
      await transform(
        'new Worker(new URL("./worker.js", import.meta.url), { "type": "module", "name": "worker1" })',
      ),
    ).toMatchInlineSnapshot(
      `"new Worker(new URL(/* @vite-ignore */ "/worker.js?worker_file&type=module", import.meta.url), { "type": "module", "name": "worker1" })"`,
    )
  })

  test('with dynamic name field in worker options', async () => {
    expect(
      await transform(
        'const id = 1; new Worker(new URL("./worker.js", import.meta.url), { name: "worker" + id })',
      ),
    ).toMatchInlineSnapshot(
      `"const id = 1; new Worker(new URL(/* @vite-ignore */ "/worker.js?worker_file&type=classic", import.meta.url), { name: "worker" + id })"`,
    )
  })

  test('with dynamic name field and static type in worker options', async () => {
    expect(
      await transform(
        'const id = 1; new Worker(new URL("./worker.js", import.meta.url), { name: "worker" + id, type: "module" })',
      ),
    ).toMatchInlineSnapshot(
      `"const id = 1; new Worker(new URL(/* @vite-ignore */ "/worker.js?worker_file&type=module", import.meta.url), { name: "worker" + id, type: "module" })"`,
    )
  })

  test('with parenthesis inside of worker options', async () => {
    expect(
      await transform(
        'const worker = new Worker(new URL("./worker.js", import.meta.url), { name: genName(), type: "module"})',
      ),
    ).toMatchInlineSnapshot(
      `"const worker = new Worker(new URL(/* @vite-ignore */ "/worker.js?worker_file&type=module", import.meta.url), { name: genName(), type: "module"})"`,
    )
  })

  test('with multi-line code and worker options', async () => {
    expect(
      await transform(`
const worker = new Worker(new URL("./worker.js", import.meta.url), {
    name: genName(),
    type: "module",
  },
)

worker.addEventListener('message', (ev) => text('.simple-worker-url', JSON.stringify(ev.data)))
`),
    ).toMatchInlineSnapshot(`"
const worker = new Worker(new URL(/* @vite-ignore */ "/worker.js?worker_file&type=module", import.meta.url), {
    name: genName(),
    type: "module",
  },
)

worker.addEventListener('message', (ev) => text('.simple-worker-url', JSON.stringify(ev.data)))
"`)
  })

  test('throws an error when non-static worker options are provided', async () => {
    await expect(
      transform(
        'new Worker(new URL("./worker.js", import.meta.url), myWorkerOptions)',
      ),
    ).rejects.toThrow(
      'Vite is unable to parse the worker options as the value is not static. To ignore this error, please use /* @vite-ignore */ in the worker options.',
    )
  })

  test('throws an error when worker options are not an object', async () => {
    await expect(
      transform(
        'new Worker(new URL("./worker.js", import.meta.url), "notAnObject")',
      ),
    ).rejects.toThrow('Expected worker options to be an object, got string')
  })

  test('throws an error when non-literal type field in worker options', async () => {
    await expect(
      transform(
        'const type = "module"; new Worker(new URL("./worker.js", import.meta.url), { type })',
      ),
    ).rejects.toThrow(
      'Expected worker options type property to be a literal value.',
    )
  })

  test('throws an error when spread operator used without the type field', async () => {
    await expect(
      transform(
        'const options = { name: "worker1" }; new Worker(new URL("./worker.js", import.meta.url), { ...options })',
      ),
    ).rejects.toThrow(
      'Expected object spread to be used before the definition of the type property. Vite needs a static value for the type property to correctly infer it.',
    )
  })

  test('throws an error when spread operator used after definition of type field', async () => {
    await expect(
      transform(
        'const options = { name: "worker1" }; new Worker(new URL("./worker.js", import.meta.url), { type: "module", ...options })',
      ),
    ).rejects.toThrow(
      'Expected object spread to be used before the definition of the type property. Vite needs a static value for the type property to correctly infer it.',
    )
  })
})
