import { resolvePlugin } from './resolve';
import aliasPlugin from '@rollup/plugin-alias';
import { Plugin, ResolvedConfig } from '../../node';
import { preAliasPlugin } from './preAlias';
import { htmlInlineScriptProxyPlugin } from '../../node/plugins/html';
import { cssPlugin, cssPostPlugin } from '../../node/plugins/css';
import { esbuildPlugin } from '../../node/plugins/esbuild';
import { jsonPlugin } from '../../node/plugins/json';
import { assetPlugin } from '../../node/plugins/asset';
import { definePlugin } from '../../node/plugins/define';
import { clientInjectionsPlugin } from '../../node/plugins/clientInjections';
import { importAnalysisPlugin } from '../../node/plugins/importAnalysis';

export async function resolvePlugins(
  config: ResolvedConfig,
  prePlugins: Plugin[],
  normalPlugins: Plugin[],
  postPlugins: Plugin[]
): Promise<Plugin[]> {
  const isBuild = config.command === 'build'

  const buildPlugins = { pre: [], post: [] };
  // isBuild ? (await import('../build')).resolveBuildPlugins(config) : ...

  return [
    isBuild ? null : preAliasPlugin(),
    aliasPlugin({ entries: config.resolve.alias }),
    ...prePlugins,
    // dynamicImportPolyfillPlugin(config),
    resolvePlugin({
      ...config.resolve,
      root: config.root,
      isProduction: config.isProduction,
      isBuild,
      ssrTarget: config.ssr?.target,
      asSrc: true
    }),
    htmlInlineScriptProxyPlugin(),
    cssPlugin(config),
    config.esbuild !== false ? esbuildPlugin(config.esbuild) : null,
    jsonPlugin(
      {
        namedExports: true,
        ...config.json
      },
      isBuild
    ),
    // wasmPlugin(config),
    // webWorkerPlugin(config),
    assetPlugin(config),
    ...normalPlugins,
    definePlugin(config),
    cssPostPlugin(config),
    ...buildPlugins.pre,
    ...postPlugins,
    ...buildPlugins.post,
    // internal server-only plugins are always applied after everything else
    ...(isBuild
      ? []
      : [clientInjectionsPlugin(config), importAnalysisPlugin(config)])
  ].filter(Boolean) as Plugin[]
}
