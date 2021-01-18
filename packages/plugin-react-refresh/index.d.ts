import { Plugin } from 'vite'

type PluginFactory = () => Plugin

declare const createPlugin: PluginFactory & { preambleCode: string }

export = createPlugin
