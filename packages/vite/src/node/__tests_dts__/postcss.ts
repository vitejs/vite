// Tests the `PostcssUserConfig` type exported from `vite` (see #19109). The
// `Equal` case asserts it stays identical to the `Config` type of the
// `postcss-load-config` version Vite loads PostCSS configs with.
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
