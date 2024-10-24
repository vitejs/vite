/* eslint-disable @typescript-eslint/ban-ts-comment */

// @ts-ignore `sass` may not be installed
import type Sass from 'sass'
// @ts-ignore `less` may not be installed
import type Less from 'less'
// @ts-ignore `less` may not be installed
import type Stylus from 'stylus'

/* eslint-enable @typescript-eslint/ban-ts-comment */

export type SassLegacyPreprocessBaseOptions = Omit<
  Sass.LegacyStringOptions<'async'>,
  | 'data'
  | 'file'
  | 'outFile'
  | 'sourceMap'
  | 'omitSourceMapUrl'
  | 'sourceMapEmbed'
  | 'sourceMapRoot'
>

export type SassModernPreprocessBaseOptions = Omit<
  Sass.StringOptions<'async'>,
  'url' | 'sourceMap'
>

export type LessPreprocessorBaseOptions = Omit<
  Less.Options,
  'sourceMap' | 'filename'
>

export type StylusPreprocessorBaseOptions = Omit<
  Stylus.RenderOptions,
  'filename'
> & { define?: Record<string, any> }

declare global {
  // LESS' types somewhat references this which doesn't make sense in Node,
  // so we have to shim it
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface HTMLLinkElement {}
}
