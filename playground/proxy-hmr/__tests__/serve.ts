// this is automatically detected by playground/vitestSetup.ts and will replace
// the default e2e test serve behavior

import path from 'node:path'
import { rootDir, setViteUrl } from '~utils'

export async function serve(): Promise<{ close(): Promise<void> }> {
  const vite = await import('vite')
  const rootServer = await vite.createServer({
    root: rootDir,
    logLevel: 'silent',
  })
  const otherServer = await vite.createServer({
    root: path.join(rootDir, 'other-app'),
    logLevel: 'silent',
  })

  await Promise.all([rootServer.listen(), otherServer.listen()])
  const viteUrl = rootServer.resolvedUrls.local[0]
  setViteUrl(viteUrl)

  return {
    async close() {
      await Promise.all([rootServer.close(), otherServer.close()])
    },
  }
}
