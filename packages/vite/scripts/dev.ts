import {
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { type BuildOptions, context } from 'esbuild'
import packageJSON from '../package.json'

rmSync('dist', { force: true, recursive: true })
mkdirSync('dist/node', { recursive: true })
writeFileSync('dist/node/index.d.ts', "export * from '../../src/node/index.ts'")
writeFileSync(
  'dist/node/module-runner.d.ts',
  "export * from '../../src/module-runner/index.ts'",
)

const serverOptions: BuildOptions = {
  bundle: true,
  platform: 'node',
  target: 'node18',
  sourcemap: true,
  external: [
    ...Object.keys(packageJSON.dependencies),
    ...Object.keys(packageJSON.peerDependencies),
    ...Object.keys(packageJSON.devDependencies),
  ],
}
const clientOptions: BuildOptions = {
  bundle: true,
  platform: 'browser',
  target: 'es2020',
  format: 'esm',
  sourcemap: true,
}

const watch = async (options: BuildOptions) => {
  const ctx = await context(options)
  await ctx.watch()
}

// envConfig
void watch({
  entryPoints: ['src/client/env.ts'],
  outfile: 'dist/client/env.mjs',
  ...clientOptions,
})
// clientConfig
void watch({
  entryPoints: ['src/client/client.ts'],
  outfile: 'dist/client/client.mjs',
  external: ['@vite/env'],
  ...clientOptions,
})
// nodeConfig
void watch({
  ...serverOptions,
  entryPoints: {
    cli: 'src/node/cli.ts',
    constants: 'src/node/constants.ts',
    index: 'src/node/index.ts',
  },
  outdir: 'dist/node',
  format: 'esm',
  splitting: true,
  chunkNames: '_[name]-[hash]',
  // The current usage of require() inside inlined workers confuse esbuild,
  // and generate top level __require which are then undefined in the worker
  // at runtime. To workaround, we move require call to ___require and then
  // back to require on build end.
  // Ideally we should move workers to ESM
  define: { require: '___require' },
  plugins: [
    {
      name: 'log',
      setup(build) {
        let first = true
        build.onEnd(() => {
          for (const file of readdirSync('dist/node')) {
            const path = `dist/node/${file}`
            const content = readFileSync(path, 'utf-8')
            if (content.includes('___require')) {
              writeFileSync(path, content.replaceAll('___require', 'require'))
            }
          }
          if (first) {
            first = false
            console.log('Watching...')
          } else {
            console.log('Rebuilt')
          }
        })
      },
    },
  ],
})
// moduleRunnerConfig
void watch({
  ...serverOptions,
  entryPoints: ['./src/module-runner/index.ts'],
  outfile: 'dist/node/module-runner.js',
  format: 'esm',
})
// cjsConfig
void watch({
  ...serverOptions,
  entryPoints: ['./src/node/publicUtils.ts'],
  outfile: 'dist/node-cjs/publicUtils.cjs',
  format: 'cjs',
  banner: {
    js: `
const { pathToFileURL } = require("node:url")
const __url = pathToFileURL(__filename)`.trimStart(),
  },
  define: {
    'import.meta.url': '__url',
  },
})
