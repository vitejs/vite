import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { rolldown } from 'rolldown'
import * as vite from 'vite'
import { afterAll, test } from 'vitest'
const task = await mkdtemp(
  join(process.env.TEST_TMPDIR ?? tmpdir(), 'asset-retention-'),
)
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jfRQAAAAASUVORK5CYII=',
  'base64',
)
let serial = 0
async function fixture(files) {
  const root = join(task, 'ownership-fixtures', `${Date.now()}-${serial++}`)
  await mkdir(root, { recursive: true })
  for (const [name, value] of Object.entries({ 'asset.png': png, ...files })) {
    await mkdir(join(root, name, '..'), { recursive: true })
    await writeFile(join(root, name), value)
  }
  return root
}
const images = (output) =>
  output.output.filter((x) => x.type === 'asset' && x.fileName.endsWith('.png'))
function intact(out) {
  assert.equal(images(out).length, 1)
  assert.deepEqual(Buffer.from(images(out)[0].source), png)
  return images(out)[0].fileName
}
const source = (x) =>
  x.type === 'chunk' ? x.code : Buffer.from(x.source).toString()
async function build(root, extra = {}) {
  return vite.build({
    configFile: false,
    root,
    logLevel: 'error',
    base: '/base/',
    ...extra,
    build: { write: false, assetsInlineLimit: 0, ...extra.build },
  })
}
for (const cssCodeSplit of [true, false])
  for (const order of ['dead-first', 'css-first'])
    test(`CSS live + dead JS query owner: ${order}, split=${cssCodeSplit}`, async () => {
      const imports =
        order === 'dead-first'
          ? `import {unused} from './dead.js';import './style.css';`
          : `import './style.css';import {unused} from './dead.js';`
      const root = await fixture({
        'index.html': '<script type="module" src="/main.js"></script>',
        'main.js': imports + `globalThis.marker=1;`,
        'dead.js': `import url from './asset.png?v=1#icon';export const unused=()=>url;`,
        'style.css': `.a{background:url('./asset.png?v=1#icon')}`,
      })
      const out = await build(root, {
        build: { cssCodeSplit, manifest: true, ssrManifest: true },
      })
      const name = intact(out)
      const css = out.output.find((x) => x.fileName.endsWith('.css'))
      assert.ok(css)
      assert.ok(source(css).includes(`/base/${name}?v=1#icon`))
      const manifest = out.output.find((x) =>
        x.fileName.endsWith('/manifest.json'),
      )
      assert.ok(manifest)
      assert.ok(source(manifest).includes(name))
      const ssr = out.output.find((x) =>
        x.fileName.endsWith('/ssr-manifest.json'),
      )
      assert.ok(ssr)
      assert.ok(source(ssr).includes(name))
    })
for (const lateDead of [false, true])
  test(`HTML asset + dead JS shared owner: ${lateDead}`, async () => {
    const root = await fixture({
      'index.html': `<img src="./asset.png?v=1#icon"><script type="module" src="/main.js"></script>`,
      'main.js': `import {unused} from './dead.js';globalThis.marker=1;`,
      'dead.js': `import url from './asset.png?v=1#icon';export const unused=()=>url;`,
    })
    let observed = false
    const out = await build(root, {
      plugins: lateDead
        ? [
            {
              name: 'preload-dead-owner',
              async buildStart() {
                await this.load({ id: join(root, 'dead.js') })
              },
            },
          ]
        : [],
      build: {
        manifest: true,
        ssrManifest: true,
        rolldownOptions: {
          output: {
            plugins: [
              {
                name: 'observe-html-owner',
                generateBundle(_, bundle) {
                  observed = Object.values(bundle).some(
                    (x) => x.type === 'asset' && x.fileName.endsWith('.png'),
                  )
                },
              },
            ],
          },
        },
      },
    })
    const name = intact(out)
    assert.ok(
      source(out.output.find((x) => x.fileName === 'index.html')).includes(
        `/base/${name}?v=1#icon`,
      ),
    )
    assert.ok(observed, 'output plugin must observe HTML-retained asset')
    assert.ok(
      source(
        out.output.find((x) => x.fileName.endsWith('/manifest.json')),
      ).includes(name),
    )
  })
for (const query of ['', '?no-inline'])
  test(`explicit asset entry retains original bytes ${query}`, async () => {
    const root = await fixture({})
    const out = await build(root, {
      build: { rolldownOptions: { input: join(root, `asset.png${query}`) } },
    })
    intact(out)
  })
test('public-dir URL retains public file and base without emitted alias', async () => {
  const root = await fixture({
    'public/public.png': png,
    'index.html': '<img src="/public.png">',
  })
  const out = await build(root, { build: { write: true, emptyOutDir: false } })
  assert.equal(images(out).length, 0)
  assert.deepEqual(await readFile(join(root, 'dist/public.png')), png)
  assert.ok(
    source(out.output.find((x) => x.fileName === 'index.html')).includes(
      '/base/public.png',
    ),
  )
})
test('Vite multiple outputs retain CSS/HTML asset in each', async () => {
  const root = await fixture({
    'index.html':
      '<img src="./asset.png"><script type="module" src="/main.js"></script>',
    'main.js': `import './style.css';`,
    'style.css': `.a{background:url('./asset.png')}`,
  })
  const outputs = await build(root, {
    build: {
      rolldownOptions: {
        output: [
          { format: 'es', assetFileNames: 'one/[name]-[hash][extname]' },
          { format: 'es', assetFileNames: 'two/[name]-[hash][extname]' },
        ],
      },
    },
  })
  assert.equal(outputs.length, 2)
  for (const [i, out] of outputs.entries()) {
    const name = intact(out)
    assert.ok(name.startsWith(i ? 'two/' : 'one/'))
    assert.ok(
      source(out.output.find((x) => x.fileName === 'index.html')).includes(
        name,
      ),
    )
  }
})
for (const select of [1, 2])
  test(`native output-only explicit ownership in generation ${select}`, async () => {
    let reference,
      count = 0
    const b = await rolldown({
      input: 'virtual',
      plugins: [
        {
          name: 'output-selective-owner',
          resolveId(id) {
            return id
          },
          load() {
            reference = this.emitFile({
              type: 'asset',
              name: 'asset.png',
              source: png,
              needsCodeReference: true,
            })
            return 'globalThis.marker=1;'
          },
          generateBundle() {
            if (++count === select) this.referenceFile(reference)
          },
        },
      ],
    })
    try {
      for (let i = 1; i <= 2; i++) {
        const out = await b.generate({ format: 'es' })
        assert.equal(images(out).length, i === select ? 1 : 0)
        if (i === select) intact(out)
      }
    } finally {
      await b.close()
    }
  })
for (const unconditionalFirst of [true, false])
  test(`native explicit filename mixed owners, unconditionalFirst=${unconditionalFirst}`, async () => {
    const b = await rolldown({
      input: 'virtual',
      plugins: [
        {
          name: 'explicit-shared',
          resolveId(id) {
            return id
          },
          load() {
            for (const needsCodeReference of unconditionalFirst
              ? [false, true]
              : [true, false])
              this.emitFile({
                type: 'asset',
                fileName: 'asset.png',
                source: png,
                needsCodeReference,
              })
            return 'globalThis.marker=1;'
          },
        },
      ],
    })
    try {
      intact(await b.generate({ format: 'es' }))
    } finally {
      await b.close()
    }
  })
test('native invented reference ID cannot bypass emitted-asset validation', async () => {
  const b = await rolldown({
    input: 'virtual',
    plugins: [
      {
        name: 'invalid-id',
        resolveId(id) {
          return id
        },
        load() {
          return 'globalThis.url=import.meta.ROLLDOWN_FILE_URL_aaaaaaaaaaaaaaaaaaaaaa;'
        },
        resolveFileUrl() {
          return '"made-up"'
        },
      },
    ],
  })
  try {
    await assert.rejects(b.generate({ format: 'es' }))
  } finally {
    await b.close()
  }
})

afterAll(async () => {
  await rm(task, { recursive: true, force: true })
})
