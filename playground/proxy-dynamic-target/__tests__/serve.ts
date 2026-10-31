// this is automatically detected by playground/vitestSetup.ts and will replace
// the default e2e test serve behavior

import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { rootDir, setViteUrl } from '~utils'

const firstTargetEnv = 'VITE_TEST_PROXY_FIRST_TARGET'
const secondTargetEnv = 'VITE_TEST_PROXY_SECOND_TARGET'

export async function serve(): Promise<{ close(): Promise<void> }> {
  const firstTarget = await startTargetServer('first')
  const secondTarget = await startTargetServer('second')
  const previousFirstTarget = process.env[firstTargetEnv]
  const previousSecondTarget = process.env[secondTargetEnv]

  process.env[firstTargetEnv] = firstTarget.url
  process.env[secondTargetEnv] = secondTarget.url

  try {
    const vite = await import('vite')
    const viteServer = await vite.createServer({
      root: rootDir,
      logLevel: 'silent',
      server: { port: 0 },
    })
    await viteServer.listen()
    setViteUrl(viteServer.resolvedUrls!.local[0])

    return {
      async close() {
        try {
          await Promise.all([
            viteServer.close(),
            firstTarget.close(),
            secondTarget.close(),
          ])
        } finally {
          restoreEnv(firstTargetEnv, previousFirstTarget)
          restoreEnv(secondTargetEnv, previousSecondTarget)
        }
      },
    }
  } catch (error) {
    await Promise.all([firstTarget.close(), secondTarget.close()])
    restoreEnv(firstTargetEnv, previousFirstTarget)
    restoreEnv(secondTargetEnv, previousSecondTarget)
    throw error
  }
}

async function startTargetServer(name: string): Promise<{
  url: string
  close(): Promise<void>
}> {
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/plain')
    res.end(`${name}:${req.url}`)
  })

  await new Promise<void>((resolve, reject) => {
    const onError = (error: Error) => reject(error)
    server.once('error', onError)
    server.listen(0, '127.0.0.1', () => {
      server.off('error', onError)
      resolve()
    })
  })

  const { port } = server.address() as AddressInfo
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => closeServer(server),
  }
}

function closeServer(server: http.Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name]
  } else {
    process.env[name] = value
  }
}
