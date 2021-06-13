import { promises as fs } from 'fs'
import path from 'path'

export async function injectSourcesContent(
  map: { sources: string[]; sourcesContent?: string[]; sourceRoot?: string },
  file: string,
  useResolvedSources?: boolean
): Promise<void> {
  const sourceRoot = await fs.realpath(
    path.resolve(path.dirname(file), map.sourceRoot || '')
  )
  map.sourcesContent = []
  await Promise.all(
    map.sources.filter(Boolean).map(async (sourcePath, i) => {
      const source = path.resolve(sourceRoot, decodeURI(sourcePath))
      map.sourcesContent![i] = await fs.readFile(source, 'utf-8')
      if (useResolvedSources) {
        map.sources[i] = source
      }
    })
  )
}
