import type { Plugin } from 'vite'

const svgVirtualModuleId = 'virtual:foo.svg'
const resolvedSvgVirtualModuleId = `\0${svgVirtualModuleId}`

export default function svgVirtualModulePlugin(): Plugin {
  return {
    name: 'svg-virtual-module',
    enforce: 'pre',
    resolveId(id) {
      if (id === svgVirtualModuleId) {
        return resolvedSvgVirtualModuleId
      }
    },
    load(id) {
      if (id === resolvedSvgVirtualModuleId) {
        return `export default '<svg><rect width="100" height="100"></svg>'`
      }
    },
  }
}
