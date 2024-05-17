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
// from https://github.com/rollup/rollup/blob/fbc25afcc2e494b562358479524a88ab8fe0f1bf/src/utils/hashPlaceholders.ts#L41-L46
const REPLACER_REGEX = new RegExp(
  // eslint-disable-next-line regexp/strict, regexp/prefer-w
  `${hashPlaceholderLeft}[0-9a-zA-Z_$]{1,${
    maxHashSize - hashPlaceholderOverhead
  }}${hashPlaceholderRight}`,
  'g',
)

const hashPlaceholderToFacadeModuleIdHashMap: Map<string, string> = new Map()

function augmentFacadeModuleIdHash(name: string): string {
  return name.replace(
    REPLACER_REGEX,
    (match) => hashPlaceholderToFacadeModuleIdHashMap.get(match) ?? match,
  )
}

export function createChunkMap(
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

export function chunkMapPlugin(): Plugin {
  return {
    name: 'vite:chunk-map',

    // If we simply remove the hash part, there is a risk of key collisions within the importmap.
    // For example, both `foo/index-[hash].js` and `index-[hash].js` would become `assets/index-.js`.
    // Therefore, we generate a hash from the facadeModuleId.
    renderChunk(code, _chunk, _options, meta) {
      Object.values(meta.chunks).forEach((chunk) => {
        const hashPlaceholder = chunk.fileName.match(REPLACER_REGEX)?.[0]
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

export function postChunkMapHook(
  config: ResolvedConfig,
): IndexHtmlTransformHook {
  return (html, ctx) => {
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
            imports: createChunkMap(bundle!, assetsBase),
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
