import type { Plugin } from 'vite'
const svgVirtualModuleId = 'virtual:foo.svg'
const resolvedSvgVirtualModuleId = '\0' + svgVirtualModuleId

export default function svgVirtualModulePlugin(): Plugin {
  return {
    name: 'svg-virtual-module',
    resolveId(id) {
      if (id === svgVirtualModuleId) {
        return resolvedSvgVirtualModuleId
      }
    },
    async load(id, _options) {
      if (id === resolvedSvgVirtualModuleId) {
        return `export default '<svg><rect width="100" height="100"></svg>'`
      }
    },
    enforce: 'pre',
  }
}
