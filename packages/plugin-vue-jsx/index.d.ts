import { Plugin } from 'vite'
import { VueJSXPluginOptions } from '@vue/babel-plugin-jsx'
import { FilterPattern } from '@rollup/pluginutils'

declare interface FilterOptions {
  include?: FilterPattern
  exclude?: FilterPattern
}

declare function createPlugin(
  options?: VueJSXPluginOptions & FilterOptions
): Plugin

export default createPlugin
