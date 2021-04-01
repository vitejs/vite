import { promises as fs } from 'fs'
import path from 'path'

export async function injectSourcesContent(
  map: { sources: string[]; sourcesContent?: string[]; sourceRoot?: string },
  file: string
) {
  const sourceRoot = await fs.realpath(
    path.resolve(path.dirname(file), map.sourceRoot || '')
  )
  map.sourcesContent = []
  await Promise.all(
    map.sources.map(async (sourcePath, i) => {
      map.sourcesContent![i] = await fs.readFile(
        path.resolve(sourceRoot, decodeURI(sourcePath)),
        'utf-8'
      )
    })
  )
}
