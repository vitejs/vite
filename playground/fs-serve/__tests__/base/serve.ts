import path from 'node:path'
import { mergeConfig } from 'vite'
import config from '../../root/vite.config-base'
import { isBuild, page, rootDir, setViteUrl, viteTestUrl } from '~utils'

export async function serve(): Promise<{ close(): Promise<void> }> {
  const { createServer } = await import('vite')
  process.env.VITE_INLINE = 'inline-serve'

  const options = {
    ...config,
    root: rootDir,
    logLevel: 'silent',
    build: {
      target: 'esnext',
    },
    server: {
      watch: {
        usePolling: true,
        interval: 100,
      },
      host: true,
      fs: {
        strict: !isBuild,
      },
    },
  }

  const rewriteTestRootOptions = {
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(rootDir, 'src/index.html'),
        },
      },
    },
    server: {
      fs: {
        strict: true,
        allow: [path.resolve(rootDir, 'src')],
      },
    },
    define: {
      ROOT: JSON.stringify(path.dirname(rootDir).replace(/\\/g, '/')),
    },
  }

  const viteServer = await (
    await createServer(mergeConfig(options, rewriteTestRootOptions))
  ).listen()

  // use resolved port/base from server
  const devBase = viteServer.config.base === '/' ? '' : viteServer.config.base

  setViteUrl(`http://localhost:${viteServer.config.server.port}${devBase}`)
  await page.goto(viteTestUrl)

  return viteServer
}
