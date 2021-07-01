import path from 'path'
import type { Logger } from '../node/logger';
import type { Plugin } from '../node/plugin';
import { mergeAlias, mergeConfig, resolveBaseUrl, sortUserPlugins, InlineConfig, ResolvedConfig } from '../node/config';
import { normalizePath } from '../node/utils';
import { resolveBuildOptions } from '../node/build';
import { CLIENT_DIR, DEFAULT_ASSETS_RE } from '../node/constants';
import { resolvePlugins } from './plugins';
import { resolveServerOptions } from './server';

export interface BrowserFS {
  readFileSync(file: string, encoding: 'utf-8'): string;
  existsSync(file: string): boolean;
}

export async function resolveConfig(
  inlineConfig: InlineConfig,
  $fs$: BrowserFS,
  command: 'build' | 'serve',
  defaultMode = 'development'
): Promise<ResolvedConfig> {
  let config = inlineConfig
  const mode = defaultMode;
  const isProduction = false;

  const configEnv = {
    mode,
    command
  }

  // Define logger
  const logger: Logger = {
    info: (s) => console.log(s),
    warn: (s) => console.log(s),
    error: (s) => console.log(s),
    clearScreen: () => {
      /* empty */
    },
    hasWarned: false,
    warnOnce: (s) => console.warn(s),
  }

  // resolve plugins
  const rawUserPlugins = [].concat
    .apply(config.plugins || [])
    .filter((p: Plugin) => {
      return p && (!p.apply || p.apply === command);
    }) as Plugin[]
  const [prePlugins, normalPlugins, postPlugins] =
    sortUserPlugins(rawUserPlugins)

  // BROWSER VITE
  // @ts-ignore
  config.$fs$ = $fs$;
  prePlugins.unshift({
    name: 'vite:tree',
    resolveId() {
      // @ts-ignore
      this.$fs$ = $fs$;
      return undefined;
    },
    load() {
      // @ts-ignore
      this.$fs$ = $fs$;
      return undefined;
    },
    transform() {
      // @ts-ignore
      this.$fs$ = $fs$;
      return undefined;
    },
  });

  // run config hooks
  const userPlugins = [...prePlugins, ...normalPlugins, ...postPlugins]
  for (const p of userPlugins) {
    if (p.config) {
      const res = await p.config(config, configEnv)
      if (res) {
        config = mergeConfig(config, res)
      }
    }
  }

  // resolve root
  const resolvedRoot = normalizePath(
    config.root ? path.resolve(config.root) : process.cwd()
  )

  // resolve alias with internal client alias
  const resolvedAlias = mergeAlias(
    // #1732 the CLIENT_DIR may contain $$ which cannot be used as direct
    // replacement string.
    // @ts-ignore because @rollup/plugin-alias' type doesn't allow function
    // replacement, but its implementation does work with function values.
    [{ find: /^\/@vite\//, replacement: () => CLIENT_DIR + '/' }],
    config.resolve?.alias || config.alias || []
  )

  const resolveOptions: ResolvedConfig['resolve'] = {
    dedupe: config.dedupe,
    ...config.resolve,
    alias: resolvedAlias
  }

  // resolve public base url
  const BASE_URL = resolveBaseUrl(config.base, command === 'build', logger)
  const resolvedBuildOptions = resolveBuildOptions(config.build)

  const cacheDir = config.cacheDir

  // create an internal resolver to be used in special scenarios, e.g.
  // optimizer & handling css @imports
  const createResolver: ResolvedConfig['createResolver'] = (options) => {
    return undefined as any;
  }

  const { publicDir } = config
  const resolvedPublicDir =
    publicDir !== false && publicDir !== ''
      ? path.resolve(
          resolvedRoot,
          typeof publicDir === 'string' ? publicDir : 'public'
        )
      : ''

  const resolved: ResolvedConfig = {
    ...config,
    configFile: undefined as any,
    configFileDependencies: [],
    inlineConfig,
    root: resolvedRoot,
    base: BASE_URL,
    resolve: resolveOptions,
    publicDir: resolvedPublicDir,
    cacheDir,
    command,
    mode,
    isProduction,
    plugins: userPlugins,
    server: resolveServerOptions(resolvedRoot, config.server),
    build: resolvedBuildOptions,
    env: {
      BASE_URL,
      MODE: mode,
      DEV: !isProduction,
      PROD: isProduction
    },
    assetsInclude(file: string) {
      return DEFAULT_ASSETS_RE.test(file);
    },
    logger,
    createResolver,
    optimizeDeps: {
      ...config.optimizeDeps,
      esbuildOptions: {
        keepNames: config.optimizeDeps?.keepNames,
        ...config.optimizeDeps?.esbuildOptions
      }
    }
  }

  ;(resolved.plugins as Plugin[]) = await resolvePlugins(
    resolved,
    prePlugins,
    normalPlugins,
    postPlugins
  )

  // call configResolved hooks
  await Promise.all(userPlugins.map((p) => p.configResolved?.(resolved)))

  return resolved
}
