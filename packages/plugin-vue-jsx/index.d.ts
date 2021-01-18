import { Plugin } from 'vite'
import { VueJSXPluginOptions } from '@vue/babel-plugin-jsx'

export type Options = VueJSXPluginOptions & {
  /** enable the legacy (stage 1) decorators syntax support for TSX */
  tsxLegacyDecorator?: boolean;
}

declare function createPlugin(options?: Options): Plugin

export default createPlugin
