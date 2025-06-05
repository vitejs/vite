import { expect, test } from 'vitest'
import { getAdditionalAllowedHosts } from '../hostCheck'

test('getAdditionalAllowedHosts', async () => {
  const actual = getAdditionalAllowedHosts(
    {
      host: 'vite.host.example.com',
      hmr: {
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
