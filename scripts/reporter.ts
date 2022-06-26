import { writeFileSync } from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

interface ReportInfo {
  hooks: string
  timing: number
}

const res = {} as Record<string, ReportInfo>

export default function ReporterPlugin(): Plugin {
  function injectTimeCollect(plugin: Plugin) {
    if (plugin.transform) {
      const _transform = plugin.transform
      plugin.transform = async function (...args) {
        const id = args[1]
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
        const id = args[0]
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

  return <Plugin>{
    name: 'vite-plugin-inspect',
    apply: 'serve',
    configResolved(config) {
      config.plugins.forEach(injectTimeCollect)
    }
  }
}

process.on('exit', () => {
  writeFileSync(
    path.join(__dirname, '../report.md'),
    '**report**\n' +
      '## Top 10\n' +
      '|hooks|file|timing|\n' +
      '|-----|----|------|\n' +
      Object.entries(res)
        .sort((a, b) => b[1].timing - a[1].timing)
        .slice(0, 10)
        .map((dat) => `|${dat[1].hooks}|${dat[0]}|${dat[1].timing}|`)
        .join('\n'),
    { encoding: 'utf8' }
  )
})
