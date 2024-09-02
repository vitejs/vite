// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- unknown if `sass` is installed
// @ts-ignore `sass` may not be installed
import type Sass from 'sass'

export type SassPreprocessOptions = Omit<
  Sass.LegacyOptions<'async'>,
  'data' | 'file' | 'outFile'
> & {
  api?: 'legacy' | 'modern' | 'modern-compiler'
  additionalData?: string
}
