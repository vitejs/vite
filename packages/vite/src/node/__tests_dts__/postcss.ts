// Tests the `PostcssUserConfig` type re-exported from `vite`. It mirrors the
// `Config` type of `postcss-load-config` (which is bundled into Vite and cannot
// be re-exported through the bundled `.d.ts`, see #19109). The `Equal` case
// below locks the two together so the mirror can never silently drift.
import type { Equal, ExpectTrue } from '@type-challenges/utils'
import type { Config as PostcssLoadConfig } from 'postcss-load-config'
import type { PostcssUserConfig } from '../index'

export type cases = [ExpectTrue<Equal<PostcssUserConfig, PostcssLoadConfig>>]

// The array plugin format is accepted.
;({ plugins: [] }) satisfies PostcssUserConfig

// The object plugin format is accepted, alongside the other options.
;({
  map: false,
  from: 'src/index.css',
  plugins: { 'postcss-preset-env': {} },
}) satisfies PostcssUserConfig

;({
  // @ts-expect-error --- `map` must be `string | false`, not a number
  map: 123,
}) satisfies PostcssUserConfig

export {}
