import type { CAC, Command } from 'cac'
import escapeHtml from 'escape-html'

type CommandOption = Command['options'][number]

interface FlagData {
  name: string
  type: string
  description: string
}

interface LoadResult {
  globalFlags: string
  viteFlags: string
  viteBuildFlags: string
  viteOptimizeFlags: string
  vitePreviewFlags: string
}

export default {
  async load(): Promise<LoadResult | undefined> {
    let cli: CAC

    try {
      // Set env var to prevent the CLI from executing
      process.env.__VITE_DOCS__ = 'true'
      // @ts-expect-error -- not typed
      const mod = await import('../../packages/vite/dist/node/cli.js')
      cli = mod.cli
    } catch {
      console.warn('TODO')
      return
    }

    return {
      globalFlags: cacOptionsToTableHtml(cli.globalCommand.options),
      viteFlags: cacOptionsToTableHtml(
        cli.commands.find((c) => c.name === '')!.options,
      ),
      viteBuildFlags: cacOptionsToTableHtml(
        cli.commands.find((c) => c.name === 'build')!.options,
      ),
      viteOptimizeFlags: cacOptionsToTableHtml(
        cli.commands.find((c) => c.name === 'optimize')!.options,
      ),
      vitePreviewFlags: cacOptionsToTableHtml(
        cli.commands.find((c) => c.name === 'preview')!.options,
      ),
    }
  },
}

function cacOptionsToTableHtml(options: CommandOption[]): string {
  const flags = options.map(cacOptionToFlagData)
  return toTableHtml(flags)
}

function cacOptionToFlagData(option: CommandOption): FlagData {
  let description = option.description
  let type = ''

  // Extract leading `[...]` as type info
  const match = /^\[(.+?)\]\s*/.exec(description)
  if (match) {
    type = match[1]
    description = description.slice(match[0].length)
  }

  return {
    name: option.rawName,
    type: type,
    description: description,
  }
}

function toTableHtml(flags: FlagData[]): string {
  let html = `\
<table>
  <thead>
    <tr>
      <th>Options</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>`

  for (const flag of flags) {
    const type = flag.type ? ` (<code>${escapeHtml(flag.type)}</code>)` : ''

    html += `
    <tr>
      <td><code>${escapeHtml(flag.name)}</code></td>
      <td>${escapeHtml(capitalize(flag.description))} ${type}</td>
    </tr>`
  }

  html += `
  </tbody>
</table>`

  return html
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
