// this is automatically detected by playground/vitestSetup.ts and will replace
// the default e2e test serve behavior

import { rootDir, setViteUrl } from '~utils'

export async function serve(): Promise<{ close(): Promise<void> }> {
  const vite = await import('vite')
  const rootServer = await vite.createServer({
    root: rootDir,
    logLevel: 'silent',
  })

  await rootServer.listen()
  const viteUrl = rootServer.resolvedUrls.local[0]
  setViteUrl(viteUrl)

  return {
    async close() {
      await rootServer.close()
    },
  }
}
