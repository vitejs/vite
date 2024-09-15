// this is automatically detected by playground/vitestSetup.ts and will replace
// the default e2e test serve behavior

import path from 'node:path'
import { ports, rootDir } from '~utils'

export const port = ports.lib

export async function serve() {
  const { build } = await import('vite')
  await build({
    root: rootDir,
    configFile: path.resolve(__dirname, '../vite.legal-comments-eof.config.js'),
  })

  await build({
    root: rootDir,
    configFile: path.resolve(
      __dirname,
      '../vite.legal-comments-external.config.js',
    ),
  })

  await build({
    root: rootDir,
    configFile: path.resolve(
      __dirname,
      '../vite.legal-comments-inline.config.js',
    ),
  })

  await build({
    root: rootDir,
    configFile: path.resolve(
      __dirname,
      '../vite.legal-comments-none.config.js',
    ),
  })

  await build({
    root: rootDir,
    configFile: path.resolve(
      __dirname,
      '../vite.legal-comments-linked.config.js',
    ),
  })
}
