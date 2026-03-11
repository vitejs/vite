import os from 'node:os'
import path from 'node:path'
import { promises as fsp } from 'node:fs'
import { expect, test } from 'vitest'
import { createServer } from '..'

async function writePackage(
  root: string,
  name: string,
  files: Record<string, string>,
) {
  const dir = path.join(root, 'node_modules', name)
  await fsp.mkdir(dir, { recursive: true })
  await fsp.writeFile(
    path.join(dir, 'package.json'),
    JSON.stringify({
      name,
      version: '1.0.0',
      type: 'module',
      exports: './index.js',
    }) + '\n',
  )
  await Promise.all(
    Object.entries(files).map(async ([file, content]) => {
      const fullPath = path.join(dir, file)
      await fsp.mkdir(path.dirname(fullPath), { recursive: true })
      await fsp.writeFile(fullPath, content)
    }),
  )
}

async function createOptimizerFixture() {
  const root = await fsp.mkdtemp(
    path.join(os.tmpdir(), 'vite-optimizer-stability-'),
  )
  await fsp.mkdir(path.join(root, 'node_modules'), { recursive: true })
  await fsp.writeFile(path.join(root, 'package.json'), '{"type":"module"}\n')

  await writePackage(root, 'dep-inner', {
    'index.js': `export const inner = 'inner'\n`,
  })
  await writePackage(root, 'dep-only-ab', {
    'index.js': `export const onlyAB = 'onlyAB'\n`,
  })
  await writePackage(root, 'dep-shared', {
    'index.js': `import { inner } from 'dep-inner'; import { onlyAB } from 'dep-only-ab'; console.log(inner, onlyAB); export const shared = inner + onlyAB;\n`,
  })
  await writePackage(root, 'dep-a', {
    'index.js': `import { shared } from 'dep-shared'; console.log(shared); export const a = shared;\n`,
  })
  await writePackage(root, 'dep-b', {
    'index.js': `import { shared } from 'dep-shared'; console.log(shared); export const b = shared;\n`,
  })
  await writePackage(root, 'dep-c', {
    'index.js': `import { inner } from 'dep-inner'; console.log(inner); export const c = inner;\n`,
  })

  return root
}

async function waitForOptimizedDeps(
  include: string[],
  optimizer: NonNullable<
    Awaited<
      ReturnType<typeof createServer>
    >['environments']['ssr']['depsOptimizer']
  >,
) {
  for (let i = 0; i < 100; i++) {
    if (include.every((id) => optimizer.metadata.optimized[id])) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  throw new Error(
    `Timed out waiting for optimized deps: ${include
      .filter((id) => !optimizer.metadata.optimized[id])
      .join(', ')}`,
  )
}

async function optimizeSsrDeps(root: string, include: string[]) {
  const cacheDir = await fsp.mkdtemp(
    path.join(os.tmpdir(), 'vite-optimizer-cache-'),
  )
  const server = await createServer({
    configFile: false,
    root,
    cacheDir,
    logLevel: 'error',
    server: {
      middlewareMode: true,
      watch: null,
      ws: false,
    },
    environments: {
      ssr: {
        optimizeDeps: {
          noDiscovery: false,
          entries: [],
          include,
        },
      },
    },
  })

  try {
    const optimizer = server.environments.ssr.depsOptimizer!
    await optimizer.init()
    await waitForOptimizedDeps(include, optimizer)
    const files = await Promise.all(
      include.map(async (id) => {
        const file = optimizer.metadata.optimized[id]!.file
        return [id, await fsp.readFile(file, 'utf8')] as const
      }),
    )
    return {
      chunks: Object.keys(optimizer.metadata.chunks),
      files: Object.fromEntries(files),
    }
  } finally {
    await server.close()
    await fsp.rm(cacheDir, { recursive: true, force: true })
  }
}

test('server dep optimization keeps previous entries stable when new deps are added', async (ctx) => {
  const root = await createOptimizerFixture()
  ctx.onTestFinished(() => fsp.rm(root, { recursive: true, force: true }))

  const base = await optimizeSsrDeps(root, ['dep-a', 'dep-b'])
  const next = await optimizeSsrDeps(root, ['dep-a', 'dep-b', 'dep-c'])

  expect(base.chunks.length).toBeGreaterThan(0)
  expect(next.files['dep-a']).toBe(base.files['dep-a'])
  expect(next.files['dep-b']).toBe(base.files['dep-b'])
})
