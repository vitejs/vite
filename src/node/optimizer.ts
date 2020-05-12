import fs from 'fs-extra'
import path from 'path'
import { createHash } from 'crypto'
import { ResolvedConfig } from './config'
import type Rollup from 'rollup'
import { supportedExts } from './resolver'

export interface OptimizeOptions extends ResolvedConfig {
  force?: boolean
}

export async function optimize(config: OptimizeOptions) {
  // scan lockfile
  const root = config.root || process.cwd()
  const cacheDir = path.join(root, `node_modules`, `.vite`)
  const hashPath = path.join(cacheDir, 'hash')
  const depHash = getDepHash(root, config.__path)

  if (!config.force) {
    let prevhash
    try {
      prevhash = await fs.readFile(hashPath, 'utf-8')
    } catch (e) {}
    // hash is consistent, no need to re-bundle
    if (prevhash === depHash) {
      console.log('hash is consistent. skipping.')
      return
    }
  }

  await fs.ensureDir(cacheDir)
  await fs.writeFile(hashPath, depHash)

  const pkg = lookupFile(root, [`package.json`])
  if (!pkg) {
    console.log(`package.json not found. skipping.`)
    return
  }

  const deps = JSON.parse(pkg).dependencies || {}
  const depKeys = Object.keys(deps)
  if (!depKeys.length) {
    console.log(`no dependencies listed in package.json. skipping.`)
    return
  }

  console.log(`optimizing dependencies...`)
  const rollup = require('rollup') as typeof Rollup

  await rollup.rollup({
    input: depKeys,
    plugins: [
      require('@rollup/plugin-node-resolve')({
        rootDir: root,
        extensions: supportedExts
      }),
      require('@rollup/plugin-commonjs')({
        sourceMap: false
      })
    ]
  })
}

const lockfileFormats = [
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'package.json'
]

let cachedHash: string | undefined

export function getDepHash(
  root: string,
  configPath: string | undefined
): string {
  if (cachedHash) {
    return cachedHash
  }
  let content = lookupFile(root, lockfileFormats) || ''
  // also take config into account
  if (configPath) {
    content += fs.readFileSync(configPath, 'utf-8')
  }
  return createHash('sha1').update(content).digest('base64')
}

function lookupFile(dir: string, formats: string[]): string | undefined {
  for (const format of formats) {
    const fullPath = path.join(dir, format)
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf-8')
    }
  }
  const parentDir = path.dirname(dir)
  if (parentDir !== dir) {
    return lookupFile(parentDir, formats)
  }
}
