import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import type { ResolvedConfig } from './config'
import type { Plugin } from './plugin'
import type { ResolvedServerUrls } from './server'
import { getHash } from './utils'

type CommandLockType = 'dev' | 'preview' | 'build'

interface CommandLockUrls {
  local: string[]
  network: string[]
}

interface CommandLockRecord {
  command: CommandLockType
  root: string
  configFile: string | null | undefined
  mode: string
  pid: number
  urls: CommandLockUrls | null | undefined
}

export interface CommandLock {
  release(): void
}

function getCommandLockUrls(
  urls: ResolvedServerUrls | null,
): CommandLockUrls | null {
  return urls ? { local: [...urls.local], network: [...urls.network] } : null
}

// Lock files can be read by different Vite versions. Keep the schema additive:
// accept unknown fields and only validate the fields this version reads.
function isCommandLockRecord(value: unknown): value is CommandLockRecord {
  if (typeof value !== 'object' || value == null) return false
  const record = value as Partial<CommandLockRecord>
  return (
    (record.command === 'dev' ||
      record.command === 'preview' ||
      record.command === 'build') &&
    typeof record.root === 'string' &&
    (typeof record.configFile === 'string' || record.configFile == null) &&
    typeof record.mode === 'string' &&
    typeof record.pid === 'number' &&
    Number.isInteger(record.pid) &&
    record.pid > 0 &&
    (record.urls == null ||
      (typeof record.urls === 'object' &&
        Array.isArray(record.urls?.local) &&
        record.urls.local.every((url) => typeof url === 'string') &&
        Array.isArray(record.urls.network) &&
        record.urls.network.every((url) => typeof url === 'string')))
  )
}

function isSameCommand(
  first: CommandLockRecord,
  second: CommandLockRecord,
): boolean {
  return (
    first.command === second.command &&
    first.root === second.root &&
    first.configFile === second.configFile &&
    first.mode === second.mode
  )
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    return code !== 'ESRCH'
  }
}

function removeFile(file: string): void {
  try {
    fs.unlinkSync(file)
  } catch {
    // Command lock files are advisory and must not affect the Vite command.
  }
}

async function scanCommandLocks(
  config: ResolvedConfig,
  lockDir: string,
  currentRecord: CommandLockRecord,
): Promise<void> {
  let files: string[]
  try {
    files = await fsp.readdir(lockDir)
  } catch {
    return
  }

  const reportedPids = new Set<number>()
  await Promise.all(
    files.map(async (file) => {
      if (!file.endsWith('.json')) return
      const lockPath = path.resolve(lockDir, file)
      let record: CommandLockRecord
      try {
        const parsed: unknown = JSON.parse(await fsp.readFile(lockPath, 'utf8'))
        if (!isCommandLockRecord(parsed)) return
        record = parsed
      } catch {
        return
      }

      if (record.pid === process.pid) return
      if (!isProcessAlive(record.pid)) {
        removeFile(lockPath)
        return
      }
      if (!isSameCommand(record, currentRecord)) return
      if (reportedPids.has(record.pid)) return
      reportedPids.add(record.pid)

      const primaryUrl = record.urls?.local[0] ?? record.urls?.network[0]
      const location = primaryUrl ? ` at ${primaryUrl}` : ''
      config.logger.info(
        `Found another Vite ${record.command} process for this project${location} (PID ${record.pid})`,
      )
    }),
  )
}

interface CommandLockController extends CommandLock {
  publish(
    config: ResolvedConfig,
    urls: ResolvedServerUrls | null,
  ): Promise<void>
  unpublish(): void
}

function createCommandLockController(
  command: CommandLockType,
): CommandLockController {
  const ownedPaths = new Set<string>()
  let currentPath: string | undefined
  let cleanupRegistered = false
  let reportDuplicates = true
  let released = false
  let generation = 0

  function onExit(): void {
    release()
  }

  function onSigint(): void {
    releaseAndResendSignal('SIGINT')
  }

  function onSigterm(): void {
    releaseAndResendSignal('SIGTERM')
  }

  function releaseAndResendSignal(signal: 'SIGINT' | 'SIGTERM'): void {
    release()
    try {
      process.kill(process.pid, signal)
    } catch {
      process.exit(signal === 'SIGINT' ? 130 : 143)
    }
  }

  function registerCleanup(): void {
    if (cleanupRegistered) return
    cleanupRegistered = true
    process.once('exit', onExit)
    process.once('SIGINT', onSigint)
    if (command === 'build') {
      process.once('SIGTERM', onSigterm)
    }
  }

  function unregisterCleanup(): void {
    if (!cleanupRegistered) return
    cleanupRegistered = false
    process.off('exit', onExit)
    process.off('SIGINT', onSigint)
    if (command === 'build') {
      process.off('SIGTERM', onSigterm)
    }
  }

  function unpublish(): void {
    generation++
    unregisterCleanup()
    for (const lockPath of ownedPaths) {
      removeFile(lockPath)
    }
    ownedPaths.clear()
    currentPath = undefined
  }

  async function publish(
    config: ResolvedConfig,
    urls: ResolvedServerUrls | null,
  ): Promise<void> {
    if (released) return
    const publishGeneration = generation

    const record: CommandLockRecord = {
      command,
      root: config.root,
      configFile: config.configFile ?? null,
      mode: config.mode,
      pid: process.pid,
      urls: getCommandLockUrls(urls),
    }
    const serialized = `${JSON.stringify(record, null, 2)}\n`
    const lockDir = path.resolve(config.cacheDir, 'lock')
    const lockPath = path.resolve(lockDir, `${getHash(serialized, 16)}.json`)
    if (lockPath === currentPath) return

    const tempPath = `${lockPath}.${process.pid}.${Math.random()
      .toString(16)
      .slice(2)}.tmp`

    try {
      await fsp.mkdir(lockDir, { recursive: true })
      await fsp.writeFile(tempPath, serialized, { flag: 'wx' })
      await fsp.rename(tempPath, lockPath)
    } catch {
      removeFile(tempPath)
      return
    }
    if (released || publishGeneration !== generation) {
      if (currentPath !== lockPath) removeFile(lockPath)
      return
    }

    const previousPath = currentPath
    currentPath = lockPath
    ownedPaths.add(lockPath)
    registerCleanup()

    if (reportDuplicates) {
      reportDuplicates = false
      await scanCommandLocks(config, lockDir, record)
    }

    if (previousPath && previousPath !== lockPath) {
      removeFile(previousPath)
      ownedPaths.delete(previousPath)
    }
  }

  function release(): void {
    if (released) return
    released = true
    unpublish()
  }

  return { publish, unpublish, release }
}

export async function createCommandLock(
  config: ResolvedConfig,
  command: Exclude<CommandLockType, 'dev'>,
  urls: ResolvedServerUrls | null,
): Promise<CommandLock> {
  const controller = createCommandLockController(command)
  await controller.publish(config, urls)
  return controller
}

export function commandLockPlugin(): Plugin {
  const controller = createCommandLockController('dev')
  return {
    name: 'vite:command-lock',
    apply: 'serve',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        void controller.publish(server.config, server.resolvedUrls)
      })
    },
    closeServer({ reason }) {
      if (reason === 'close') {
        controller.release()
      } else {
        controller.unpublish()
      }
    },
  }
}
