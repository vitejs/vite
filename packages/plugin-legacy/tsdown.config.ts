import path from 'node:path'
import fs from 'node:fs'
import { defineConfig } from 'tsdown'
import { fdir } from 'fdir'

const pluginLegacyForRolldownVitePackagePath = path.resolve(
  import.meta.dirname,
  './node_modules/@vitejs/plugin-legacy-for-rolldown-vite',
)

export default defineConfig({
  entry: ['src/index.ts'],
  target: 'node20',
  tsconfig: false, // disable tsconfig `paths` when bundling
  dts: true,
  hooks: {
    async 'build:done'() {
      validateAllDepsForRolldownViteIsIncluded()

      const files = new fdir()
        .glob('!**/*.d.ts')
        .withRelativePaths()
        .crawl(path.join(pluginLegacyForRolldownVitePackagePath, 'dist'))
        .sync()
      for (const file of files) {
        const src = path.resolve(
          pluginLegacyForRolldownVitePackagePath,
          'dist',
          file,
        )
        const dist = path.resolve(
          import.meta.dirname,
          'dist/vendor/rolldown-vite',
          file,
        )
        fs.mkdirSync(path.dirname(dist), { recursive: true })
        fs.copyFileSync(src, dist)
      }
    },
  },
})

function validateAllDepsForRolldownViteIsIncluded() {
  const pkgJsonStr = fs.readFileSync(
    path.resolve(import.meta.dirname, 'package.json'),
    'utf-8',
  )
  const pkgJson = JSON.parse(pkgJsonStr)

  const pkgJsonForRolldownViteStr = fs.readFileSync(
    path.resolve(pluginLegacyForRolldownVitePackagePath, 'package.json'),
    'utf-8',
  )
  const pkgJsonForRolldownVite = JSON.parse(pkgJsonForRolldownViteStr)

  for (const depName of Object.keys(
    pkgJsonForRolldownVite.dependencies ?? {},
  )) {
    if (!pkgJson.dependencies[depName]) {
      throw new Error(
        `All deps for rolldown-vite version of @vitejs/plugin-legacy should be ` +
          `included in @vitejs/plugin-legacy, but ${depName} is not included.`,
      )
    }
  }
}
