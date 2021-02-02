import { Plugin } from 'vite'
import { ParserOptions } from '@babel/core'

type PluginFactory = (options?: Options) => Plugin

declare const createPlugin: PluginFactory & { preambleCode: string }

export interface Options {
  parserPlugins: ParserOptions['plugins']
}

export default createPlugin
