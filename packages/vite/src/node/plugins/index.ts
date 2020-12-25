import { ResolvedConfig } from '../config'
import { Plugin } from '../plugin'
import aliasPlugin from '@rollup/plugin-alias'
import jsonPlugin from '@rollup/plugin-json'
import { resolvePlugin } from './resolve'
import { esbuildPlugin } from './esbuild'
import { importAnalysisPlugin } from './importsAnalysis'
import { cssPlugin, cssPostPlugin } from './css'
import { assetPlugin } from './asset'
import { clientInjectionsPlugin } from './clientInjections'
import { htmlPlugin } from './html'
import { wasmPlugin } from './wasm'
import { webWorkerPlugin } from './worker'

export function resolvePlugins(
  config: ResolvedConfig,
  prePlugins: Plugin[],
  normalPlugins: Plugin[],
  postPlugins: Plugin[]
): Plugin[] {
  return [
    aliasPlugin({ entries: config.alias }),
    ...prePlugins,
    resolvePlugin(
      config.root,
      config.command === 'build',
      true,
      config.optimizeCacheDir
    ),
    htmlPlugin(),
    cssPlugin(config),
    esbuildPlugin(config.esbuild || {}),
    jsonPlugin({
      preferConst: true,
      namedExports: true
    }),
    wasmPlugin(config),
    webWorkerPlugin(config),
    assetPlugin(config),
    ...normalPlugins,
    ...postPlugins,
    cssPostPlugin(config),
    // internal server-only plugins are always applied after everything else
    ...(config.command === 'build'
      ? []
      : [clientInjectionsPlugin(config), importAnalysisPlugin(config)])
  ].filter(Boolean) as Plugin[]
}
