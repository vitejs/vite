import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import chokidar from 'chokidar'

/**
 * returns `true` for WSL2 including docker running on WSL2
 *
 * https://github.com/microsoft/WSL/issues/423#issuecomment-844418910
 */
export const isWSL2 = (() => {
  const release = os.release()
  // Example: `5.10.102.1-microsoft-standard-WSL2`
  if (release.includes('WSL2')) {
    // "Docker Desktop for Windows with WSL2 backend" and "Docker installed in WSL" comes here too
    return true
  }

  // Windows Example: `10.0.19044`
  // WSL1 Example: `4.4.0-19041-Microsoft`
  // Docker Desktop for Windows with WSL2 backend Example: `5.10.76-linuxkit`
  return false
})()

/**
 * returns `true` when it works, `false` when it doesn't, `undefined` when it failed to detect
 */
export const detectWhetherChokidarWithDefaultOptionWorks = (
  root: string
): Promise<{ result: boolean | undefined; warning: string | undefined }> =>
  new Promise((resolve) => {
    const editWait = 100
    const detectWaitTimeout = 500

    const id = ('' + performance.now()).replace(/\./g, '')
    const tempFileShort = `.chokidardetector.${id}.txt`
    const tempFile = path.resolve(root, tempFileShort)

    let wroteFile = false

    let timeoutId: NodeJS.Timeout
    const w = chokidar.watch(root, {
      depth: 1,
      disableGlobbing: true,
      ignoreInitial: true
    })
    // add works with WSL2, but edit does not work
    w.on('edit', () => {
      resolveWithCleanup(true)
    })
    w.on('error', () => {
      resolveWithCleanup(undefined)
    })
    w.on('ready', () => {
      ;(async () => {
        try {
          await fs.promises.writeFile(tempFile, 'detector', 'utf-8')
          wroteFile = true
          await new Promise((resolve) => setTimeout(resolve, editWait))
          // edit file
          await fs.promises.writeFile(tempFile, 'detector2', 'utf-8')
        } catch {
          resolveWithCleanup(undefined)
        }
      })()

      timeoutId = setTimeout(() => {
        resolveWithCleanup(false)
      }, detectWaitTimeout)
    })

    let resolved = false
    const resolveWithCleanup = async (result: boolean | undefined) => {
      if (resolved) return
      resolved = true

      clearTimeout(timeoutId)
      await w.close()

      let warning: string | undefined
      if (wroteFile) {
        try {
          await fs.promises.unlink(tempFile)
        } catch {
          warning = `Failed to remove temp file (${tempFileShort}). This file can be removed.`
        }
      }
      resolve({ result, warning })
    }
  })
