import type { Equal, ExpectTrue } from '@type-challenges/utils'
import type { Config as PostcssLoadConfig } from 'postcss-load-config'
import type { PostcssUserConfig } from '../index'

export type cases = [ExpectTrue<Equal<PostcssUserConfig, PostcssLoadConfig>>]

;({ plugins: [] }) satisfies PostcssUserConfig

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
