import { expect, test } from 'vitest'
import type { ConfigHint } from '../../..'
import {
  getAdditionalAllowedHosts,
  hostValidationMiddleware,
} from '../hostCheck'

test('getAdditionalAllowedHosts', async () => {
  const actual = getAdditionalAllowedHosts(
    {
      host: 'vite.host.example.com',
      ws: {
        host: 'vite.hmr-host.example.com',
      },
      origin: 'http://vite.origin.example.com:5173',
    },
    {
      host: 'vite.preview-host.example.com',
    },
  ).sort()
  expect(actual).toStrictEqual(
    [
      'vite.host.example.com',
      'vite.hmr-host.example.com',
      'vite.origin.example.com',
      'vite.preview-host.example.com',
    ].sort(),
  )
})

async function blockedHostMessage(isPreview: boolean, configHint?: ConfigHint) {
  let message = ''
  await hostValidationMiddleware(['localhost'], isPreview, configHint)(
    { headers: { host: 'evil.example.com' } } as any,
    {
      writeHead: () => undefined,
      end: (body: string) => (message = body),
    } as any,
    () => {},
  )
  return message
}

test('the blocked-host error names vite.config.js by default', async () => {
  expect(await blockedHostMessage(false)).toContain(
    'add "evil.example.com" to `server.allowedHosts` in vite.config.js.',
  )
})

test('the blocked-host error names the file and key in configHint', async () => {
  expect(
    await blockedHostMessage(true, { file: 'my-tool.config.js', key: 'vite' }),
  ).toContain(
    'add "evil.example.com" to `vite.preview.allowedHosts` in my-tool.config.js.',
  )
})
