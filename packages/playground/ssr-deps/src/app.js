import path from 'path'
import { hello } from 'node-addon'
import readFileContent from 'read-file-content'

export async function render(url, rootDir) {
  let html = ''

  const nodeAddonMsg = hello()
  html += `\n<p class="node-addon-msg">message from node addon: ${nodeAddonMsg}</p>`

  const fileContent = await readFileContent(path.resolve(rootDir, 'message'))
  html += `\n<p class="file-message">msg read via fs/promises: ${fileContent}</p>`

  return html + '\n'
}
