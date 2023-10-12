import { transform } from 'esbuild'
import type { ResolvedConfig } from '../config'
import type { Plugin } from '../plugin'
import { isCSSRequest } from './css'
import { isHTMLRequest } from './html'

const nonJsRe = /\.json(?:$|\?)/
const metaEnvRe = /import\.meta\.env\.(.+)/
const isNonJsRequest = (request: string): boolean => nonJsRe.test(request)

export function definePlugin(config: ResolvedConfig): Plugin {
  const isBuild = config.command === 'build'
  const isBuildLib = isBuild && config.build.lib

  // ignore replace process.env in lib build
  const processNodeEnv: Record<string, string> = {}
  const processEnv: Record<string, string> = {}
  if (!isBuildLib) {
    const nodeEnv = process.env.NODE_ENV || config.mode
    Object.assign(processNodeEnv, {
      'process.env.NODE_ENV': JSON.stringify(nodeEnv),
      'global.process.env.NODE_ENV': JSON.stringify(nodeEnv),
      'globalThis.process.env.NODE_ENV': JSON.stringify(nodeEnv),
      __vite_process_env_NODE_ENV: JSON.stringify(nodeEnv),
    })
    Object.assign(processEnv, {
      'process.env': `{}`,
      'global.process.env': `{}`,
      'globalThis.process.env': `{}`,
    })
  }

  const userDefine: Record<string, string> = {}
  const userDefineEnv: Record<string, string> = {}
  for (const key in config.define) {
    const val = config.define[key]
    userDefine[key] = typeof val === 'string' ? val : JSON.stringify(val)

    // make sure `import.meta.env` object has user define properties
    if (isBuild) {
      const match = key.match(metaEnvRe)
      if (match) {
        userDefineEnv[match[1]] = `__vite__define__${key}__define__vite__`
      }
    }
  }

  // during dev, import.meta properties are handled by importAnalysis plugin.
  const importMetaKeys: Record<string, string> = {}
  const importMetaFallbackKeys: Record<string, string> = {}
  if (isBuild) {
    // set here to allow override with config.define
    importMetaKeys['import.meta.hot'] = `undefined`
    for (const key in config.env) {
      importMetaKeys[`import.meta.env.${key}`] = JSON.stringify(config.env[key])
    }
    Object.assign(importMetaFallbackKeys, {
      'import.meta.env.': `({}).`,
      'import.meta.env': JSON.stringify({
        ...config.env,
        SSR: '__vite__ssr__',
        ...userDefineEnv,
      }).replace(
        /"__vite__define__(.+?)__define__vite__"/g,
        (_, key) => userDefine[key],
      ),
    })
  }

  function getImportMetaKeys(ssr: boolean): Record<string, string> {
    if (!isBuild) return {}
    return {
      ...importMetaKeys,
      'import.meta.env.SSR': ssr + '',
    }
  }

  function getImportMetaFallbackKeys(ssr: boolean): Record<string, string> {
    if (!isBuild) return {}
    return {
      ...importMetaFallbackKeys,
      'import.meta.env': importMetaFallbackKeys['import.meta.env'].replace(
        '"__vite__ssr__"',
        ssr + '',
      ),
    }
  }

  function generatePattern(ssr: boolean) {
    const replaceProcessEnv = !ssr || config.ssr?.target === 'webworker'

    const replacements: Record<string, string> = {
      ...(replaceProcessEnv ? processNodeEnv : {}),
      ...getImportMetaKeys(ssr),
      ...userDefine,
      ...getImportMetaFallbackKeys(ssr),
      ...(replaceProcessEnv ? processEnv : {}),
    }

    if (isBuild && !replaceProcessEnv) {
      replacements['__vite_process_env_NODE_ENV'] = 'process.env.NODE_ENV'
    }

    return Object.keys(replacements).length ? replacements : null
  }

  const defaultReplacements = generatePattern(false)
  const ssrReplacements = generatePattern(true)

  return {
    name: 'vite:define',

    async transform(code, id, options) {
      const ssr = options?.ssr === true
      if (!ssr && !isBuild) {
        // for dev we inject actual global defines in the vite client to
        // avoid the transform cost. see the clientInjection plugin.
        return
      }

      if (
        // exclude html, css and static assets for performance
        isHTMLRequest(id) ||
        isCSSRequest(id) ||
        isNonJsRequest(id) ||
        config.assetsInclude(id)
      ) {
        return
      }

      const replacements = ssr ? ssrReplacements : defaultReplacements
      if (!replacements) return

      return await replaceDefine(code, id, replacements, config)
    },
  }
}

export async function replaceDefine(
  code: string,
  id: string,
  replacements: Record<string, string>,
  config: ResolvedConfig,
): Promise<{ code: string; map: string | null }> {
  const result = await transform(code, {
    loader: 'js',
    charset: 'utf8',
    platform: 'neutral',
    define: replacements,
    sourcefile: id,
    sourcemap: config.command === 'build' && !!config.build.sourcemap,
  })
  return {
    code: result.code,
    map: result.map || null,
  }
}
