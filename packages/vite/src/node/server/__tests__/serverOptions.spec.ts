import { execSync } from 'node:child_process'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createLogger } from '../../logger'
import { resolveServerOptions } from '../index'

vi.mock('node:child_process', async (importOriginal) => {
  const mod = await importOriginal<typeof import('node:child_process')>()
  return {
    ...mod,
    execSync: vi.fn(),
  }
})

describe('resolveServerOptions', () => {
  const execSyncMock = vi.mocked(execSync)

  beforeEach(() => {
    execSyncMock.mockReset()
  })

  test('adds pnpm store path when enableGlobalVirtualStore is true', async () => {
    execSyncMock.mockImplementation((command) => {
      if (command === 'pnpm config get enableGlobalVirtualStore') {
        return Buffer.from('true\n')
      }
      if (command === 'pnpm store path') {
        return Buffer.from('/tmp/pnpm-store\n')
      }
      throw new Error(`Unexpected command: ${command}`)
    })

    const logger = createLogger('silent')
    const server = await resolveServerOptions('/project', undefined, logger)

    expect(server.fs.allow).toContain('/tmp/pnpm-store')
    expect(execSyncMock).toHaveBeenCalledWith(
      'pnpm config get enableGlobalVirtualStore',
      { cwd: '/project' },
    )
    expect(execSyncMock).toHaveBeenCalledWith('pnpm store path', {
      cwd: '/project',
    })
  })

  test('does not add pnpm store path when enableGlobalVirtualStore is false', async () => {
    execSyncMock.mockImplementation((command) => {
      if (command === 'pnpm config get enableGlobalVirtualStore') {
        return Buffer.from('false\n')
      }
      throw new Error(`Unexpected command: ${command}`)
    })

    const logger = createLogger('silent')
    const server = await resolveServerOptions('/project', undefined, logger)

    expect(server.fs.allow).not.toContain('/tmp/pnpm-store')
    expect(execSyncMock).toHaveBeenCalledTimes(1)
  })

  test('ignores pnpm lookup errors', async () => {
    execSyncMock.mockImplementation(() => {
      throw new Error('pnpm not found')
    })

    const logger = createLogger('silent')
    await expect(
      resolveServerOptions('/project', undefined, logger),
    ).resolves.toBeDefined()
  })
})
