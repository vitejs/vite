import { writeFileSync } from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

interface ReportInfo {
  hooks: string
  timing: number
}

const res = {} as Record<string, ReportInfo>

export default function ReporterPlugin(): Plugin {
  const transformMap: Record<string, ReportInfo> = {}
  const loadMap: Record<string, ReportInfo> = {}
  const filter = (id: string) => !id.includes('node_modules')

  function injectTimeCollect(plugin: Plugin) {
    if (plugin.transform) {
      const _transform = plugin.transform
      plugin.transform = async function (...args) {
        const id = args[1]
        const start = Date.now()
        const result = await _transform.apply(this, args)
        const end = Date.now()

        if (result != null && filter(id)) {
          if (!transformMap[id]) {
            transformMap[id] = { hooks: 'transform', timing: 0 }
          }
          transformMap[id].timing += end - start
        }

        return result
      }
    }

    if (plugin.load) {
      const _load = plugin.load
      plugin.load = async function (...args) {
        const id = args[0]
        const start = Date.now()
        const result = await _load.apply(this, args)
        const end = Date.now()

        if (result != null && filter(id)) {
          if (!transformMap[id]) {
            transformMap[id] = { hooks: 'load', timing: 0 }
          }
          transformMap[id].timing += end - start
        }

        return result
      }
    }
  }

  return <Plugin>{
    name: 'vite-plugin-inspect',
    apply: 'serve',
    configResolved(config) {
      config.plugins.forEach(injectTimeCollect)
    },

    async buildEnd() {
      Object.assign(res, transformMap, loadMap)
    }
  }
}

process.on('exit', () => {
  writeFileSync(path.join(__dirname, '../report.md'), 'hello', {
    encoding: 'utf8'
  })
})
