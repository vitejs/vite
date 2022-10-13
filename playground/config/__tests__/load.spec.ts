import { resolve } from 'node:path'
import { loadConfigFromFile } from 'vite'
import { expect, it } from 'vitest'

it('loadConfigFromFile', async () => {
  const { config } = await loadConfigFromFile(
    {} as any,
    resolve(__dirname, '../packages/entry/vite.config.ts')
  )
  expect(config).toMatchInlineSnapshot(`
    {
      "array": [
        [
          1,
          3,
        ],
        [
          2,
          4,
        ],
      ],
    }
  `)
})

it('loadConfigFromFile with rollupconfig', async () => {
  const { config } = await loadConfigFromFile(
    {} as any,
    resolve(__dirname, '../packages/entry/vite.config.ts')
  )
  expect(config).toMatchObject({
    array: [
      [1, 3],
      [2, 4]
    ],
    build: {
      plugins: [],
      external: [],
      onwarn: function add(msg) {
        console.log(msg)
      },
      input: 'src/index.ts',
      output: {
        amd: undefined,
        assetFileNames: undefined,
        banner: undefined,
        chunkFileNames: undefined,
        compact: undefined,
        dir: 'dist',
        dynamicImportFunction: undefined,
        entryFileNames: undefined,
        esModule: undefined,
        exports: undefined,
        extend: undefined,
        externalLiveBindings: undefined,
        file: undefined,
        footer: undefined,
        format: 'cjs',
        freeze: undefined,
        generatedCode: undefined,
        globals: undefined,
        hoistTransitiveImports: undefined,
        indent: undefined,
        inlineDynamicImports: undefined,
        interop: undefined,
        intro: undefined,
        manualChunks: undefined,
        minifyInternalExports: undefined,
        name: undefined,
        namespaceToStringTag: undefined,
        noConflict: undefined,
        outro: undefined,
        paths: undefined,
        plugins: [],
        preferConst: undefined,
        preserveModules: undefined,
        preserveModulesRoot: undefined,
        sanitizeFileName: undefined,
        sourcemap: undefined,
        sourcemapBaseUrl: undefined,
        sourcemapExcludeSources: undefined,
        sourcemapFile: undefined,
        sourcemapPathTransform: undefined,
        strict: undefined,
        systemNullSetters: undefined,
        validate: undefined
      }
    }
  })
})
