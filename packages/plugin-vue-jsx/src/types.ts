import type { VueJSXPluginOptions } from '@vue/babel-plugin-jsx'
import type { FilterPattern } from '@rollup/pluginutils'

export interface FilterOptions {
  include?: FilterPattern
  exclude?: FilterPattern
}

export type Options = VueJSXPluginOptions &
  FilterOptions & { babelPlugins?: any[] }
