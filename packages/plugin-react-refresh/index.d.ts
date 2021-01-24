import { Plugin } from 'vite'
import { FilterPattern } from '@rollup/pluginutils'

type PluginOptions = {
  include?: FilterPattern
  exclude?: FilterPattern
}

type PluginFactory = (options: PluginOptions) => Plugin

declare const createPlugin: PluginFactory & { preambleCode: string }

export = createPlugin
