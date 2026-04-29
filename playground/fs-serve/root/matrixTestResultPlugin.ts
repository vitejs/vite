import type { Plugin } from 'vite'
import escapeHtml from 'escape-html'

const testIds = [
  'safe',
  'safe-query',
  'safe-subdir',
  'safe-subdir-special-characters',
  'safe-subdir-special-characters2',
  'safe-imported',
  'safe-imported-query',
  'unsafe',
  'unsafe-json',
  'unsafe-html',
  'unsafe-html-outside-root',
  'unsafe-8498',
  'unsafe-8498-2',
  'unsafe-import-inline',
  'unsafe-raw-query-import',
  'unsafe-raw-import-raw-outside-root',
  'unsafe-raw-import-raw-outside-root1',
  'unsafe-raw-import-raw-outside-root2',
  'unsafe-url',
  'unsafe-query-dot-svg-import',
  'unsafe-svg',
  'unsafe-import-inline-wasm-init',
  'unsafe-relative-path-after-query',
  'unsafe-dotenv',
  'unsafe-dotenv-casing',
  'unsafe-dotenv-raw',
  'unsafe-dotenv-url',
  'unsafe-dotenv-inline',
  'unsafe-dotenv-query-dot-svg-wasm-init',
  'unsafe-dotenv-import-raw',
]

export default function matrixTestResultPlugin(): Plugin {
  return {
    name: 'matrix-test-result',
    transformIndexHtml(html) {
      const summary = `
<h1>FS Serve Matrix Test Summary</h1>
<div>
  <table id="matrix-summary">
    <thead>
      <tr>
        <th>Name</th>
        <th>Normal</th>
        <th>/@fs/</th>
      </tr>
    </thead>
    <tbody>
      ${testIds
        .map(
          (id) =>
            `
              <tr>
                <td>${escapeHtml(id)}</td>
                ${['', '-fs']
                  .map((variant) =>
                    `
                      <td>
                        <code class="fetch${variant}-${escapeHtml(id)}-path"></code>
                        <div>
                          <p class="fetch${variant}-${escapeHtml(id)}-status"></p>
                          <a href="#fetch${variant}-${escapeHtml(id)}-content">#</a>
                        </div>
                      </td>
                    `.trim(),
                  )
                  .join('\n')}
              </tr>
            `,
        )
        .join('\n')}
    </tbody>
  </table>
</div>
      `.trim()

      const contents = `
<h1>FS Serve Test Contents</h1>
<div id="matrix-contents">
  ${['', '-fs']
    .map((variant) =>
      testIds
        .map((id) =>
          `
        <div>
          <h2 id="fetch${variant}-${escapeHtml(id)}-content">${escapeHtml(id)}</h2>
          <pre class="fetch${variant}-${escapeHtml(id)}-content"></pre>
        </div>
      `.trim(),
        )
        .join('\n'),
    )
    .join('\n')}
</div>
      `.trim()

      const style = `
<style>
#matrix-summary {
  tr td > div {
    display: flex;
    align-items: baseline;
    gap: 0.3em;
  }
  tr:nth-child(even) {
    background-color: #eeeeee;
  }
  th {
    background-color: #6b1eb9;
    color: white;
  }
  th, td {
    padding: 0.2em;
  }
  td {
    max-width: 20vw;
  }
  p {
    margin: 0;
  }
  code {
    word-break: break-all;
  }
}
#matrix-contents {
  h2 {
    font-size: 1.2rem;
    font-weight: bold;
  }
}
</style>
      `.trim()

      return html.replace(
        '<!-- REPLACE WITH MATRIX TEST RESULT -->',
        `\n${summary}\n${contents}\n${style}\n`,
      )
    },
  }
}
