import fs from 'node:fs/promises'
import path from 'node:path'
import { rootDir, startDefaultServe, viteServer } from '~utils'

export async function preServe() {
  await fs.cp(path.resolve(import.meta.dirname, 'root'), rootDir, {
    recursive: true,
  })
}

export async function serve() {
  await startDefaultServe()
  return viteServer
}
