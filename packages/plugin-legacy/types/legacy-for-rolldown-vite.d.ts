import type { Plugin } from 'vite'
import type { Options } from '../src/types'

declare const plugin: (options?: Options) => Plugin[]
export default plugin
