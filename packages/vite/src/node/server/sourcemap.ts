import path from 'path'
import { promises as fs } from 'fs'
import { Logger } from '../logger'
import { createDebugger } from '../utils'

const isDebug = !!process.env.DEBUG
const debug = createDebugger('vite:sourcemap', {
  onlyWhenFocused: true
})

// Virtual modules should be prefixed with a null byte to avoid a
// false positive "missing source" warning. We also check for certain
// prefixes used for special handling in esbuildDepPlugin.
const virtualSourceRE = /^(\0|dep:|browser-external:)/

interface SourceMapLike {
  sources: string[]
  sourcesContent?: (string | null)[]
  sourceRoot?: string
}

export async function injectSourcesContent(
  map: SourceMapLike,
  file: string,
  logger: Logger
): Promise<void> {
  let sourceRoot: string | undefined
  try {
    // The source root is undefined for virtual modules and permission errors.
    sourceRoot = await fs.realpath(
      path.resolve(path.dirname(file), map.sourceRoot || '')
    )
  } catch {}

  const missingSources: string[] = []
  map.sourcesContent = await Promise.all(
    map.sources.map((sourcePath) => {
      if (sourcePath && !virtualSourceRE.test(sourcePath)) {
        sourcePath = decodeURI(sourcePath)
        if (sourceRoot) {
          sourcePath = path.resolve(sourceRoot, sourcePath)
        }
        return fs.readFile(sourcePath, 'utf-8').catch(() => {
          missingSources.push(sourcePath)
          return null
        })
      }
      return null
    })
  )

  // Use this command…
  //    DEBUG="vite:sourcemap" vite build
  // …to log the missing sources.
  if (missingSources.length) {
    logger.warnOnce(`Sourcemap for "${file}" points to missing source files`)
    isDebug && debug(`Missing sources:\n  ` + missingSources.join(`\n  `))
  }
}
