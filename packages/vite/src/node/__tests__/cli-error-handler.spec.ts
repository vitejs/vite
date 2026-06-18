// Covers the VITE_ERROR_HANDLER external-spawn path in cli.ts.
//
// Mirrors the openclaw/openclaw#93310 test structure for the equivalent
// OPENCLAW_ERROR_HANDLER contract: mock node:child_process at the module
// boundary, drive the helper through its env-gated spawn behavior, and
// pin the spawn options + payload schema so future refactors that drop
// the security/privacy guards are caught.
import { EventEmitter } from 'node:events'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

const spawnMock = vi.hoisted(() => vi.fn())

vi.mock('node:child_process', async () => ({
  ...(await vi.importActual<typeof import('node:child_process')>(
    'node:child_process',
  )),
  spawn: spawnMock,
}))

// Import after vi.mock so the mocked spawn is what runExternalErrorHandler
// resolves at call time.
const { runExternalErrorHandler } = await import('../cli')

class FakeChild extends EventEmitter {
  unref = vi.fn()
}

function resetSpawnMock(child: FakeChild = new FakeChild()): void {
  spawnMock.mockReset()
  spawnMock.mockReturnValue(child)
}

interface SpawnCall {
  command: string
  args: readonly string[]
  options: {
    env?: NodeJS.ProcessEnv
    stdio?: 'ignore' | 'pipe' | 'inherit' | NodeJS.StdioOptions
    detached?: boolean
    shell?: boolean | string
  }
}

function firstCall(): SpawnCall {
  const call = spawnMock.mock.calls[0]
  if (!call) {
    throw new Error('Expected spawn to have been called')
  }
  const [command, args, options] = call as [
    string,
    readonly string[],
    SpawnCall['options'],
  ]
  return { command, args, options }
}

describe('runExternalErrorHandler', () => {
  const ORIGINAL_ENV = process.env.VITE_ERROR_HANDLER

  beforeEach(() => {
    resetSpawnMock()
    delete process.env.VITE_ERROR_HANDLER
  })

  afterEach(() => {
    if (ORIGINAL_ENV === undefined) {
      delete process.env.VITE_ERROR_HANDLER
    } else {
      process.env.VITE_ERROR_HANDLER = ORIGINAL_ENV
    }
  })

  it('does not spawn when VITE_ERROR_HANDLER is unset', () => {
    runExternalErrorHandler('build_failure')
    expect(spawnMock).not.toHaveBeenCalled()
  })

  it('does not spawn when VITE_ERROR_HANDLER is the empty string', () => {
    process.env.VITE_ERROR_HANDLER = ''
    runExternalErrorHandler('build_failure')
    expect(spawnMock).not.toHaveBeenCalled()
  })

  it('does not spawn when VITE_ERROR_HANDLER is whitespace only', () => {
    process.env.VITE_ERROR_HANDLER = '   \t  '
    runExternalErrorHandler('build_failure')
    expect(spawnMock).not.toHaveBeenCalled()
  })

  it('spawns the configured handler with a single JSON argv entry', () => {
    process.env.VITE_ERROR_HANDLER = '/usr/bin/logger'
    runExternalErrorHandler('build_failure')

    const call = firstCall()
    expect(call.command).toBe('/usr/bin/logger')
    expect(call.args).toHaveLength(1)

    const payload = JSON.parse(call.args[0] as string)
    expect(payload).toMatchObject({
      schemaVersion: 1,
      reason: 'build_failure',
      pid: process.pid,
    })
    expect(typeof payload.timestamp).toBe('string')
    expect(() => new Date(payload.timestamp).toISOString()).not.toThrow()
  })

  it('does not include error message, name, or stack in the payload (argv visibility)', () => {
    process.env.VITE_ERROR_HANDLER = '/usr/bin/logger'
    runExternalErrorHandler('build_failure')

    const payload = JSON.parse(firstCall().args[0] as string)
    expect(payload).not.toHaveProperty('message')
    expect(payload).not.toHaveProperty('name')
    expect(payload).not.toHaveProperty('stack')
    expect(payload).not.toHaveProperty('error')
  })

  it('uses PATH-only env, stdio ignore, detached, and shell false', () => {
    process.env.VITE_ERROR_HANDLER = '/usr/bin/logger'
    runExternalErrorHandler('dev_failure')

    const { options } = firstCall()
    expect(options.env).toEqual({ PATH: process.env.PATH })
    expect(options.stdio).toBe('ignore')
    expect(options.detached).toBe(true)
    expect(options.shell).toBe(false)
  })

  it('emits distinct reason values for each CLI command failure', () => {
    process.env.VITE_ERROR_HANDLER = '/usr/bin/logger'

    runExternalErrorHandler('dev_failure')
    runExternalErrorHandler('build_failure')
    runExternalErrorHandler('optimize_deps_failure')
    runExternalErrorHandler('preview_failure')

    expect(spawnMock).toHaveBeenCalledTimes(4)
    const reasons = spawnMock.mock.calls.map(
      (call) => JSON.parse(call[1][0] as string).reason,
    )
    expect(reasons).toEqual([
      'dev_failure',
      'build_failure',
      'optimize_deps_failure',
      'preview_failure',
    ])
  })

  it('trims surrounding whitespace from the env var before spawning', () => {
    process.env.VITE_ERROR_HANDLER = '  /usr/bin/logger  '
    runExternalErrorHandler('build_failure')

    expect(firstCall().command).toBe('/usr/bin/logger')
  })

  it('calls unref() on the child so Vite does not wait on the handler', () => {
    const child = new FakeChild()
    resetSpawnMock(child)
    process.env.VITE_ERROR_HANDLER = '/usr/bin/logger'
    runExternalErrorHandler('build_failure')

    expect(child.unref).toHaveBeenCalledTimes(1)
  })

  it('does not throw on async ENOENT/EACCES from the handler path', () => {
    const child = new FakeChild()
    resetSpawnMock(child)
    process.env.VITE_ERROR_HANDLER = '/nonexistent/handler'
    runExternalErrorHandler('build_failure')

    expect(() => child.emit('error', new Error('ENOENT'))).not.toThrow()
  })
})