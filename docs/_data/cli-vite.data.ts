import escapeHtml from 'escape-html'
import type { FlagData } from '../.vitepress/updateData.config'
import data from './cli-vite.json'

export default {
  async load() {
    return {
      globalFlags: toTableHtml(data.globalFlags),
      viteDevFlags: toTableHtml(data.viteDevFlags),
      viteBuildFlags: toTableHtml(data.viteBuildFlags),
      viteOptimizeFlags: toTableHtml(data.viteOptimizeFlags),
      vitePreviewFlags: toTableHtml(data.vitePreviewFlags),
    }
  },
}

function toTableHtml(flags: FlagData[]): string {
  let html = `\
<table>
  <thead>
    <tr>
      <th>Option</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>`

  for (const flag of flags) {
    const type = flag.type ? ` (<code>${escapeHtml(flag.type)}</code>)` : ''

    html += `
    <tr>
      <td><code>${escapeHtml(flag.name)}</code></td>
      <td>${escapeHtml(flag.description)} ${type}</td>
    </tr>`
  }

  html += `
  </tbody>
</table>`

  return html
}
