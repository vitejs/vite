import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// packages/vite/client.d.ts, shipped as the `types` of the `vite` package
const clientDts = path.resolve(__dirname, '../../../client.d.ts')
const repoRoot = path.resolve(__dirname, '../../../../..')
const tsc = path.join(repoRoot, 'node_modules', 'typescript', 'bin', 'tsc')
const fixture = path.resolve(__dirname, './fixtures/client-types/url-raw.ts')

describe('client.d.ts', () => {
  test('`?url&raw` imports are typed as string (fix #21277)', () => {
    // `?url&raw` is supported at runtime: the `?raw` handler in the asset
    // plugin reads the file and returns its content as a string, so the
    // type declaration must exist and resolve to `string`. Type-check the
    // fixture with the repo's own `tsc` binary.
    const result = spawnSync(
      process.execPath,
      [
        tsc,
        '--noEmit',
        '--strict',
        '--target',
        'esnext',
        '--module',
        'esnext',
        '--moduleResolution',
        'bundler',
        '--skipLibCheck',
        fixture,
        clientDts,
      ],
      { encoding: 'utf-8' },
    )
    expect(result.status).toBe(0)
    expect(result.stdout + result.stderr).toBe('')
  })
})
