import path from 'node:path'
import url from 'node:url'
import { defineBuildConfig } from 'unbuild'
import licensePlugin from '../../scripts/rollupLicensePlugin.mjs'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export default defineBuildConfig({
  entries: ['src/index'],
  clean: true,
  rollup: {
    inlineDependencies: true,
    esbuild: {
      minify: true,
    },
  },
  alias: {
    // we can always use non-transpiled code since we support 14.18.0+
    prompts: 'prompts/lib/index.js',
  },
  hooks: {
    'rollup:options'(ctx, options) {
      if (!options.plugins) {
        options.plugins = []
      }
      options.plugins.push(
        licensePlugin(
          path.resolve(__dirname, './LICENSE'),
          'create-vite license',
          'create-vite',
        ),
      )
    },
  },
})
