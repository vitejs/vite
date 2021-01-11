import { Plugin } from 'vite'
import { VueJSXPluginOptions } from '@vue/babel-plugin-jsx'

declare function createPlugin(options?: VueJSXPluginOptions): Plugin

export default createPlugin
