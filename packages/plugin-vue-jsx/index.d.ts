import { Plugin } from 'vite'
import { VueJSXPluginOptions } from '@vue/babel-plugin-jsx'
import { FilterPattern } from '@rollup/pluginutils'

declare interface CommonOptions {
    include?: FilterPattern;
    exclude?: FilterPattern;
}

declare function createPlugin(options?: VueJSXPluginOptions & CommonOptions): Plugin

export default createPlugin
