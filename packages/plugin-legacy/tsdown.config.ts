import path from 'node:path'
import fs from 'node:fs'
import { defineConfig } from 'tsdown'
import { parseTarGzip } from 'nanotar'

// for rolldown-vite v7.0.9, check https://pkg.pr.new/~/vitejs/rolldown-vite
const PLUGIN_LEGACY_FOR_ROLLDOWN_VITE =
  'https://pkg.pr.new/vitejs/rolldown-vite/@vitejs/plugin-legacy@5c52bbc'

export default defineConfig({
  entry: ['src/index.ts'],
  target: 'node20',
  tsconfig: false, // disable tsconfig `paths` when bundling
  dts: true,
  hooks: {
    async 'build:prepare'() {
      const result = await getPluginLegacyForRolldownVite()
      for (const entry of result) {
        if (entry.type === 'file') {
          if (entry.name === 'package/package.json') {
            validateAllDepsForRolldownViteIsIncluded(entry.text)
            continue
          }

          const dist = path.resolve(
            import.meta.dirname,
            'vendor/rolldown-vite',
            entry.name.replace('package/dist/', ''),
          )
          fs.mkdirSync(path.dirname(dist), { recursive: true })
          fs.writeFileSync(dist, entry.data!)
        }
      }
    },
  },
})

async function getPluginLegacyForRolldownVite() {
  const res = await fetch(PLUGIN_LEGACY_FOR_ROLLDOWN_VITE)
  return await parseTarGzip(await res.arrayBuffer(), {
    filter(file) {
      return (
        (file.name.startsWith('package/dist') &&
          !file.name.endsWith('.d.ts')) ||
        file.name === 'package/package.json'
      )
    },
  })
}

function validateAllDepsForRolldownViteIsIncluded(
  pkgJsonForRolldownViteStr: string,
) {
  const pkgJsonStr = fs.readFileSync(
    path.resolve(import.meta.dirname, 'package.json'),
    'utf-8',
  )
  const pkgJson = JSON.parse(pkgJsonStr)
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
