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
    const warnings: string[] = []
    // @ts-expect-error transform.handler should exist
    const result = await instance.transform.handler.call(
      {
        environment,
        parse: parseAst,
        warn: (msg: string | { message: string }) => {
          warnings.push(typeof msg === 'string' ? msg : msg.message)
        },
      },
      code,
      'foo.ts',
    )
    return result?.code || result
  }
}

async function createWorkerImportMetaUrlPluginTransformWithWarnings() {
  const config = await resolveConfig({ configFile: false }, 'serve')
  const instance = workerImportMetaUrlPlugin(config)
  const environment = new PartialEnvironment('client', config)

  return async (code: string) => {
    const warnings: string[] = []
    // @ts-expect-error transform.handler should exist
    const result = await instance.transform.handler.call(
      {
        environment,
        parse: parseAst,
        warn: (msg: string | { message: string }) => {
          warnings.push(typeof msg === 'string' ? msg : msg.message)
        },
      },
      code,
      'foo.ts',
    )
    return { code: result?.code || result, warnings }
  }
}

describe('workerImportMetaUrlPlugin - indirect new URL warnings', async () => {
  const transformWithWarnings =
    await createWorkerImportMetaUrlPluginTransformWithWarnings()

  test('warns when new URL is assigned to a variable before being passed to Worker', async () => {
    const { code, warnings } = await transformWithWarnings(
      `const url = new URL('./worker.js', import.meta.url)
new Worker(url)`,
    )
    expect(code).toBeNull()
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain(
      `\`new URL('./worker.js', import.meta.url)\` is not directly passed to a Worker constructor`,
    )
    expect(warnings[0]).toContain(
      `new Worker(new URL('./worker.js', import.meta.url))`,
    )
  })

  test('warns for each indirect URL when multiple workers use variable URLs', async () => {
    const { warnings } = await transformWithWarnings(
      `const url1 = new URL('./cpu.worker.js', import.meta.url)
const url2 = new URL('./gpu.worker.js', import.meta.url)
new Worker(url1)
new Worker(url2)`,
    )
    expect(warnings).toHaveLength(2)
  })

  test('does not warn when new URL is passed directly to Worker', async () => {
    const { warnings } = await transformWithWarnings(
      `new Worker(new URL('./worker.js', import.meta.url))`,
    )
    expect(warnings).toHaveLength(0)
  })

  test('does not warn for dynamic template literal URLs', async () => {
    const { warnings } = await transformWithWarnings(
      'const name = "worker"\n' +
        'const url = new URL(`./' +
        '$' +
        '{name}.js`, import.meta.url)\n' +
        'new Worker(url)',
    )
    expect(warnings).toHaveLength(0)
  })
})

describe('workerImportMetaUrlPlugin', async () => {
  const transform = await createWorkerImportMetaUrlPluginTransform()

  test('without worker options', async () => {
    expect(
      await transform('new Worker(new URL("./worker.js", import.meta.url))'),
    ).toMatchInlineSnapshot(
      `"new Worker(new URL(/* @vite-ignore */ "/worker.js?worker_file&type=classic", '' + import.meta.url))"`,
    )
  })

  test('with shared worker', async () => {
    expect(
      await transform(
        'new SharedWorker(new URL("./worker.js", import.meta.url))',
      ),
    ).toMatchInlineSnapshot(
      `"new SharedWorker(new URL(/* @vite-ignore */ "/worker.js?worker_file&type=classic", '' + import.meta.url))"`,
    )
  })

  test('with static worker options and identifier properties', async () => {
    expect(
      await transform(
        'new Worker(new URL("./worker.js", import.meta.url), { type: "module", name: "worker1" })',
      ),
    ).toMatchInlineSnapshot(
      `"new Worker(new URL(/* @vite-ignore */ "/worker.js?worker_file&type=module", '' + import.meta.url), { type: "module", name: "worker1" })"`,
    )
  })

  test('with static worker options and literal properties', async () => {
    expect(
      await transform(
        'new Worker(new URL("./worker.js", import.meta.url), { "type": "module", "name": "worker1" })',
      ),
    ).toMatchInlineSnapshot(
      `"new Worker(new URL(/* @vite-ignore */ "/worker.js?worker_file&type=module", '' + import.meta.url), { "type": "module", "name": "worker1" })"`,
    )
  })

  test('with dynamic name field in worker options', async () => {
    expect(
      await transform(
        'const id = 1; new Worker(new URL("./worker.js", import.meta.url), { name: "worker" + id })',
      ),
    ).toMatchInlineSnapshot(
      `"const id = 1; new Worker(new URL(/* @vite-ignore */ "/worker.js?worker_file&type=classic", '' + import.meta.url), { name: "worker" + id })"`,
    )
  })

  test('with interpolated dynamic name field in worker options', async () => {
    expect(
      await transform(
        'const id = 1; new Worker(new URL("./worker.js", import.meta.url), { name: `worker-${id}` })',
      ),
    ).toMatchInlineSnapshot(
      `"const id = 1; new Worker(new URL(/* @vite-ignore */ "/worker.js?worker_file&type=classic", '' + import.meta.url), { name: \`worker-\${id}\` })"`,
    )
  })

  test('with dynamic name field and static type in worker options', async () => {
    expect(
      await transform(
        'const id = 1; new Worker(new URL("./worker.js", import.meta.url), { name: "worker" + id, type: "module" })',
      ),
    ).toMatchInlineSnapshot(
      `"const id = 1; new Worker(new URL(/* @vite-ignore */ "/worker.js?worker_file&type=module", '' + import.meta.url), { name: "worker" + id, type: "module" })"`,
    )
  })

  test('with interpolated dynamic name field and static type in worker options', async () => {
    expect(
      await transform(
        'const id = 1; new Worker(new URL("./worker.js", import.meta.url), { name: `worker-${id}`, type: "module" })',
      ),
    ).toMatchInlineSnapshot(
      `"const id = 1; new Worker(new URL(/* @vite-ignore */ "/worker.js?worker_file&type=module", '' + import.meta.url), { name: \`worker-\${id}\`, type: "module" })"`,
    )
  })

  test('with parenthesis inside of worker options', async () => {
    expect(
      await transform(
        'const worker = new Worker(new URL("./worker.js", import.meta.url), { name: genName(), type: "module"})',
      ),
    ).toMatchInlineSnapshot(
      `"const worker = new Worker(new URL(/* @vite-ignore */ "/worker.js?worker_file&type=module", '' + import.meta.url), { name: genName(), type: "module"})"`,
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
    ).toMatchInlineSnapshot(`
      "
      const worker = new Worker(new URL(/* @vite-ignore */ "/worker.js?worker_file&type=module", '' + import.meta.url), {
          name: genName(),
          type: "module",
        },
      )

      worker.addEventListener('message', (ev) => text('.simple-worker-url', JSON.stringify(ev.data)))
      "
    `)
  })

  test('trailing comma', async () => {
    expect(
      await transform(`
new Worker(
  new URL('./worker.js', import.meta.url),
  {
    type: 'module'
  }, // },
)
`),
    ).toMatchInlineSnapshot(`
      "
      new Worker(
        new URL(/* @vite-ignore */ "/worker.js?worker_file&type=module", '' + import.meta.url),
        {
          type: 'module'
        }, // },
      )
      "
    `)
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

  test('find closing parenthesis correctly', async () => {
    expect(
      await transform(
        `(() => { new Worker(new URL('./worker', import.meta.url)); repro({ test: "foo", }); })();`,
      ),
    ).toMatchInlineSnapshot(
      `"(() => { new Worker(new URL(/* @vite-ignore */ "/worker?worker_file&type=classic", '' + import.meta.url)); repro({ test: "foo", }); })();"`,
    )
    expect(
      await transform(
        `repro(new Worker(new URL('./worker', import.meta.url)), { type: "module" })`,
      ),
    ).toMatchInlineSnapshot(
      `"repro(new Worker(new URL(/* @vite-ignore */ "/worker?worker_file&type=classic", '' + import.meta.url)), { type: "module" })"`,
    )
  })

  test('with multi-line new URL and trailing comma', async () => {
    expect(
      await transform(`new Worker(
  new URL(
    "./worker.js",
    import.meta.url,
  )
)`),
    ).toMatchInlineSnapshot(`
      "new Worker(
        new URL(/* @vite-ignore */ "/worker.js?worker_file&type=classic", '' + import.meta.url)
      )"
    `)
  })

  test('with multi-line new URL, trailing comma, and worker options', async () => {
    expect(
      await transform(`const worker = new Worker(
  new URL(
    "./worker.js",
    import.meta.url,
  ),
  { type: "module" },
)`),
    ).toMatchInlineSnapshot(`
      "const worker = new Worker(
        new URL(/* @vite-ignore */ "/worker.js?worker_file&type=module", '' + import.meta.url),
        { type: "module" },
      )"
    `)
  })
})
