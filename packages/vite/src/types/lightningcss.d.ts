import type {
  BundleAsyncOptions,
  CustomAtRules,
  TransformAttributeOptions,
} from 'lightningcss'

// remove options overriden by vite
export type LightningCSSOptions = Omit<
  BundleAsyncOptions<CustomAtRules> & TransformAttributeOptions,
  | 'filename'
  | 'code'
  | 'resolver'
  | 'minify'
  | 'sourceMap'
  | 'analyzeDependencies'
>
