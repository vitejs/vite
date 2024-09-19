import path from 'node:path'
import type { OutputBundle, OutputChunk } from 'rollup'
import MagicString from 'magic-string'
import { getHash, normalizePath } from '../utils'
import type { Plugin } from '../plugin'
import type { ResolvedConfig } from '../config'
import type { IndexHtmlTransformHook } from './html'

const hashPlaceholderLeft = '!~{'
const hashPlaceholderRight = '}~'
const hashPlaceholderOverhead =
  hashPlaceholderLeft.length + hashPlaceholderRight.length
export const maxHashSize = 22
// from https://github.com/rollup/rollup/blob/91352494fc722bcd5e8e922cd1497b34aec57a67/src/utils/hashPlaceholders.ts#L41-L46
const hashPlaceholderRE = new RegExp(
  // eslint-disable-next-line regexp/strict, regexp/prefer-w
  `${hashPlaceholderLeft}[0-9a-zA-Z_$]{1,${
    maxHashSize - hashPlaceholderOverhead
  }}${hashPlaceholderRight}`,
  'g',
)

const hashPlaceholderToFacadeModuleIdHashMap = new Map()

function augmentFacadeModuleIdHash(name: string): string {
  return name.replace(
    hashPlaceholderRE,
    (match) => hashPlaceholderToFacadeModuleIdHashMap.get(match) ?? match,
  )
}

export function createChunkImportMap(
  bundle: OutputBundle,
  base: string = '',
): Record<string, string> {
  return Object.fromEntries(
    Object.values(bundle)
      .filter((chunk): chunk is OutputChunk => chunk.type === 'chunk')
      .map((output) => {
        return [
          base + augmentFacadeModuleIdHash(output.preliminaryFileName),
          base + output.fileName,
        ]
      }),
  )
}

export function chunkImportMapPlugin(): Plugin {
  return {
    name: 'vite:chunk-importmap',

    // If the hash part is simply removed, there is a risk of key collisions within the importmap.
    // For example, both `foo/index-[hash].js` and `index-[hash].js` would become `assets/index-.js`.
    // Therefore, a hash is generated from the facadeModuleId to avoid this issue.
    renderChunk(code, _chunk, _options, meta) {
      Object.values(meta.chunks).forEach((chunk) => {
        const hashPlaceholder = chunk.fileName.match(hashPlaceholderRE)?.[0]
        if (!hashPlaceholder) return
        if (hashPlaceholderToFacadeModuleIdHashMap.get(hashPlaceholder)) return

        hashPlaceholderToFacadeModuleIdHashMap.set(
          hashPlaceholder,
          getHash(chunk.facadeModuleId ?? chunk.fileName),
        )
      })

      const codeProcessed = augmentFacadeModuleIdHash(code)
      return {
        code: codeProcessed,
        map: new MagicString(codeProcessed).generateMap({
          hires: 'boundary',
        }),
      }
    },
  }
}

export function postChunkImportMapHook(
  config: ResolvedConfig,
): IndexHtmlTransformHook {
  return (html, ctx) => {
    if (!config.build.chunkImportMap) return

    const { filename, bundle } = ctx

    const relativeUrlPath = path.posix.relative(
      config.root,
      normalizePath(filename),
    )
    const assetsBase = getBaseInHTML(relativeUrlPath, config)

    return {
      html,
      tags: [
        {
          tag: 'script',
          attrs: { type: 'importmap' },
          children: JSON.stringify({
            imports: createChunkImportMap(bundle!, assetsBase),
          }),
          injectTo: 'head-prepend',
        },
      ],
    }
  }
}

function getBaseInHTML(urlRelativePath: string, config: ResolvedConfig) {
  // Prefer explicit URL if defined for linking to assets and public files from HTML,
  // even when base relative is specified
  return config.base === './' || config.base === ''
    ? path.posix.join(
        path.posix.relative(urlRelativePath, '').slice(0, -2),
        './',
      )
    : config.base
}
