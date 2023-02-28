import path from 'node:path'
import fs from 'node:fs/promises'
import type { Metafile } from 'esbuild'
import { init, parse as parseImports } from 'es-module-lexer'
import { TraceMap, originalPositionFor } from '@jridgewell/trace-mapping'
import MagicString from 'magic-string'

export async function fixImportMetaUrl(
  outputs: Metafile['outputs'],
  root: string,
): Promise<void> {
  await init
  await Promise.all(
    Object.keys(outputs).map(async (relativePath) => {
      if (relativePath.endsWith('.map')) return

      const absPath = path.resolve(root, relativePath)
      const absSourcemapPath = `${absPath}.map`
      await fixImportMetaUrlSingleFile(absPath, absSourcemapPath)
    }),
  )
}

async function fixImportMetaUrlSingleFile(file: string, sourcemapFile: string) {
  const content = await fs.readFile(file, 'utf-8')
  if (!content.includes('import.meta.url')) return

  const ms = new MagicString(content)
  const tracemap = new TraceMap(await fs.readFile(sourcemapFile, 'utf-8'))

  const [imports] = parseImports(content, file)
  for (const imp of imports) {
    // skip other than import.meta
    if (imp.d !== -2) continue
    // skip other than import.meta.url
    if (content.slice(imp.e, imp.e + 4) !== '.url') continue

    const line = (content.slice(0, imp.s).match(/\n/g)?.length ?? 0) + 1
    const col = imp.s - content.lastIndexOf('\n', imp.s)
    const originalPos = originalPositionFor(tracemap, { line, column: col })
    if (originalPos.source) {
      // TODO: replace new URL(new URL(, import.meta.url)) with a single new URL(, import.meta.url)
      ms.overwrite(
        imp.s,
        imp.e + 4,
        `new URL(${JSON.stringify(originalPos.source)}, import.meta.url).href`,
      )
    }
  }

  await fs.writeFile(file, ms.toString(), 'utf-8')
  // TODO: sourcemap
}
