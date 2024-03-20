import path from 'node:path'
import fs from 'node:fs'
import { DevEnvironment } from '../environment'
import type { ServerHMRChannel } from '../hmr'
import type { ViteDevServer } from '../index'
import { asyncFunctionDeclarationPaddingLineCount } from '../../../shared/utils'

export function createSsrEnvironment(
  hotChannel: ServerHMRChannel,
  server: ViteDevServer,
  name: string,
): DevEnvironment {
  const environment = new DevEnvironment(server, name, {
    hot: hotChannel,
    ssr: {
      async processRequest(req, res) {
        const url = req.url

        assert(url, () => `Request URL is missing.`)

        const entry = server.config.ssr.entry

        assert(entry, () => `SSR entry is not specified.`)

        let template = fs.readFileSync(
          path.resolve(server.config.root, 'index.html'),
          'utf-8',
        )

        template = await server.transformIndexHtml(url, template)

        assert(
          template.includes(`<!--ssr-outlet-->`),
          () => `index.html is missing the "<!--ssr-outlet-->" comment.`,
        )

        const resolvedEntry = await server.pluginContainer.resolveId(
          entry,
          undefined,
          { environment },
        )

        assert(resolvedEntry, () => `Failed to resolve SSR entry: ${entry}`)

        const { render } = await server.nodeModuleRunner.import(
          resolvedEntry.id,
        )

        assert(
          typeof render === 'function',
          () =>
            `"${entry}" should export a "render" function for SSR, instead received: ${typeof render}`,
        )

        const appHtml = await render(url)

        assert(
          typeof appHtml === 'string',
          () =>
            `SSR render function for "${entry}" should return a string, received: ${typeof appHtml}`,
        )

        const html = template.replace(`<!--ssr-outlet-->`, appHtml)

        res.statusCode = 200
        res.setHeader('Content-Type', 'text/html')
        res.end(html)
      },
      processSourceMap(map) {
        // this assumes that "new AsyncFunction" is used to create the module
        return Object.assign({}, map, {
          mappings:
            ';'.repeat(asyncFunctionDeclarationPaddingLineCount) + map.mappings,
        })
      },
    },
  })
  return environment
}

function assert(assertion: unknown, message: () => string): asserts assertion {
  if (!assertion) {
    throw new Error(message())
  }
}
