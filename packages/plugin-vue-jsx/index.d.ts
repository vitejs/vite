import { Plugin } from 'vite'

// https://github.com/vuejs/jsx-next/tree/dev/packages/babel-plugin-jsx#options
export interface Options {
  transformOn?: boolean
  optimize?: boolean
  isCustomElement?: (tag: string) => boolean
  mergeProps?: boolean
}

declare function createPlugin(options?: Options): Plugin

export default createPlugin
