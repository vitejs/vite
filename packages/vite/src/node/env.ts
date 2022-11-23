import fs from 'node:fs'
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import { arraify, lookupFile } from './utils'
import type { UserConfig } from './config'
import type { Logger } from './logger'

export function loadEnv(
  mode: string,
  envDir: string,
  prefixes: string | string[] = 'VITE_',
  logger?: Logger
): Record<string, string> {
  if (mode === 'local' && logger) {
    logger.warn(
      `"local" mode conflicts with the .local postfix for .env files.`
    )
  }
  prefixes = arraify(prefixes)
  const env: Record<string, string> = {}
  const envFiles = new Set([
    /** default file */ `.env`,
    /** local file */ `.env.local`
  ])

  if (mode) {
    /** mode file */
    envFiles.add(`.env.${mode}`)
    /** mode local file */
    envFiles.add(`.env.${mode}.local`)
  }

  const parsed = Object.fromEntries(
    [...envFiles].flatMap((file) => {
      const path = lookupFile(envDir, [file], {
        pathOnly: true,
        rootDir: envDir
      })
      if (!path) return []
      return Object.entries(
        dotenv.parse(fs.readFileSync(path), {
          debug: process.env.DEBUG?.includes('vite:dotenv')
        })
      )
    })
  )

  // let environment variables use each other
  const expandParsed = dotenvExpand({
    parsed: {
      ...(process.env as any),
      ...parsed
    },
    // prevent process.env mutation
    ignoreProcessEnv: true
  } as any).parsed!

  Object.keys(parsed).forEach((key) => {
    parsed[key] = expandParsed[key]
  })

  // only keys that start with prefix are exposed to client
  for (const [key, value] of Object.entries(parsed)) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) {
      env[key] = value
    } else if (
      key === 'NODE_ENV' &&
      process.env.VITE_USER_NODE_ENV === undefined
    ) {
      // NODE_ENV override in .env file
      process.env.VITE_USER_NODE_ENV = value
    }
  }

  // check if there are actual env variables starting with VITE_*
  // these are typically provided inline and should be prioritized
  for (const key in process.env) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) {
      env[key] = process.env[key] as string
    }
  }

  return env
}

export function resolveEnvPrefix(
  { envPrefix = 'VITE_' }: UserConfig,
  logger?: Logger
): string[] {
  envPrefix = arraify(envPrefix).map((prefix) => prefix.trim())
  if (logger && envPrefix.some((prefix) => prefix === '')) {
    logger.warn(
      `envPrefix option contains value '', which could lead unexpected exposure of sensitive information.`
    )
  }
  return envPrefix.filter((prefix) => !!prefix)
}
