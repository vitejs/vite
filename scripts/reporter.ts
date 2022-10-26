import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { Plugin, ResolvedConfig } from 'vite'

interface ReportInfo {
  hooks: string
  timing: number
}

const res = {} as Record<string, ReportInfo>

export default function ReporterPlugin(): Plugin {
  function injectTimeCollect(plugin: Plugin, config: ResolvedConfig) {
    if (plugin.transform) {
      const _transform = plugin.transform
      plugin.transform = async function (...args) {
        const id = args[1].replace(config.root, '')
        const start = Date.now()
        const result = await _transform.apply(this, args)
        const end = Date.now()

        if (result != null) {
          if (!res[id]) {
            res[id] = { hooks: 'transform', timing: 0 }
          }
          res[id].timing += end - start
        }

        return result
      }
    }

    if (plugin.load) {
      const _load = plugin.load
      plugin.load = async function (...args) {
        const id = args[0].replace(config.root, '')
        const start = Date.now()
        const result = await _load.apply(this, args)
        const end = Date.now()

        if (result != null) {
          if (!res[id]) {
            res[id] = { hooks: 'load', timing: 0 }
          }
          res[id].timing += end - start
        }

        return result
      }
    }
  }

  return {
    name: 'vite-plugin-inspect',
    apply: 'serve',
    configResolved(config) {
      config.plugins.forEach((plugin) => injectTimeCollect(plugin, config))
    }
  } as Plugin
}

process.on('exit', () => {
  const type = process.env.VITE_TEST_BUILD ? 'build' : 'serve'
  const dir = path.join(__dirname, '../reports/')
  if (!existsSync(dir)) {
    mkdirSync(dir)
  }

  const filePath = path.join(dir, `${type}.json`)
  const json = JSON.stringify(res)
  writeFileSync(filePath, json, { encoding: 'utf8' })
  writeFileSync(path.join(dir, `new.${type}.json`), json, { encoding: 'utf8' })
})
