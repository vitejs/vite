import { Plugin } from 'vite'

export type Provider = 'skypack' | 'esm.run' | 'jspm'

declare function createPlugin(
  provider: Provider,
  deps: { [dep: string]: string }
): Plugin

export default createPlugin

export const cspHashes: string[]
