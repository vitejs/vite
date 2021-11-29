import path from 'path'
import { hello } from 'node-addon'
import readFileContent from 'read-file-content'

export async function render(url, rootDir) {
  let html = '\n'

  const nodeAddonMsg = hello()
  html += `<p class="node-addon-msg">message from node addon: ${nodeAddonMsg}</p>\n`

  const fileContent = await readFileContent(path.resolve(rootDir, 'message'))
  html += `<p class="file-message">msg read via fs/promises: ${fileContent}</p>\n`

  return html
}
