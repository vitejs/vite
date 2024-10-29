import fs from 'node:fs/promises'
import path from 'node:path'
import colors from 'picocolors'
import { glob } from 'tinyglobby'
import { FS_PREFIX } from '../constants'
import { normalizePath } from '../utils'
import type { ViteDevServer } from '../index'
import type { DevEnvironment } from './environment'

export function warmupFiles(
  server: ViteDevServer,
  environment: DevEnvironment,
): void {
  const { root } = server.config
  mapFiles(environment.config.dev.warmup, root).then((files) => {
    for (const file of files) {
      warmupFile(server, environment, file)
    }
  })
}

async function warmupFile(
  server: ViteDevServer,
  environment: DevEnvironment,
  file: string,
) {
  // transform html with the `transformIndexHtml` hook as Vite internals would
  // pre-transform the imported JS modules linked. this may cause `transformIndexHtml`
  // plugins to be executed twice, but that's probably fine.
  if (file.endsWith('.html')) {
    const url = htmlFileToUrl(file, server.config.root)
    if (url) {
      try {
        const html = await fs.readFile(file, 'utf-8')
        await server.transformIndexHtml(url, html)
      } catch (e) {
        // Unexpected error, log the issue but avoid an unhandled exception
        environment.logger.error(
          `Pre-transform error (${colors.cyan(file)}): ${e.message}`,
          {
            error: e,
            timestamp: true,
          },
        )
      }
    }
  }
  // for other files, pass it through `transformRequest` with warmup
  else {
    const url = fileToUrl(file, server.config.root)
    await environment.warmupRequest(url)
  }
}

function htmlFileToUrl(file: string, root: string) {
  const url = path.relative(root, file)
  // out of root, ignore file
  if (url[0] === '.') return
  // file within root, create root-relative url
  return '/' + normalizePath(url)
}

function fileToUrl(file: string, root: string) {
  const url = path.relative(root, file)
  // out of root, use /@fs/ prefix
  if (url[0] === '.') {
    return path.posix.join(FS_PREFIX, normalizePath(file))
  }
  // file within root, create root-relative url
  return '/' + normalizePath(url)
}

async function mapFiles(files: string[], root: string) {
  if (!files.length) return []
  return await glob(files, {
    absolute: true,
    cwd: root,
    expandDirectories: false,
    ignore: ['**/.git/**', '**/node_modules/**'],
  })
}
