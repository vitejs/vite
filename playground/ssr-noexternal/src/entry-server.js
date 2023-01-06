import requireExternalCjs from '@vitejs/test-require-external-cjs'

export async function render(url) {
  let html = ''

  html += `\n<p class="require-external-cjs">message from require-external-cjs: ${requireExternalCjs}</p>`

  return html + '\n'
}
