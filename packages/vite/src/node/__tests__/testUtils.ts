import { onTestFinished } from 'vitest'
import type { InlineConfig, ViteDevServer } from '..'
import { createServer } from '../server'

export async function createTestServer(
  config?: InlineConfig,
): Promise<ViteDevServer> {
  const server = await createServer(config)
  onTestFinished(() => server.close())
  return server
}
