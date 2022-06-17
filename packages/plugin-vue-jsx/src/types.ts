import type { VueJSXPluginOptions } from '@vue/babel-plugin-jsx'
import type { FilterPattern } from 'vite'

export interface FilterOptions {
  include?: FilterPattern
  exclude?: FilterPattern
}

export type Options = VueJSXPluginOptions &
  FilterOptions & { babelPlugins?: any[] }
