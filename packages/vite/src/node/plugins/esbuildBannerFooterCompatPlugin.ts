import MagicString from 'magic-string'
import type { Plugin } from '../plugin'
import type { ResolvedConfig } from '../config'
import { createFilter } from '../utils'
import { cleanUrl } from '../../shared/utils'

/**
 * This plugin supports `esbuild.banner` and `esbuild.footer` options.
 * esbuild supported these options and Vite exposed them.
 * But this should be done by plugin with transform hook.
 * This plugin makes these options work in rolldown-vite as a backward compat for now.
 */
export function esbuildBannerFooterCompatPlugin(
  config: ResolvedConfig,
): Plugin | undefined {
  const options = config.esbuild
  if (!options) return

  const { include, exclude, banner, footer } = options
  if (!banner && !footer) return

  const filter = createFilter(include || /\.(m?ts|[jt]sx)$/, exclude || /\.js$/)

  return {
    name: 'vite:esbuild-banner-footer-compat',
    transform(code, id) {
      if (filter(id) || filter(cleanUrl(id))) {
        const needsSourcemap =
          this.environment.mode === 'dev' ||
          (this.environment.mode === 'build' &&
            this.environment.config.build.sourcemap)
        if (!needsSourcemap) {
          if (banner) {
            code = `${banner}\n${code}`
          }
          if (footer) {
            code = `${code}\n${footer}`
          }
          return code
        }

        let s: MagicString | undefined
        const str = () => s || (s = new MagicString(code))

        if (banner) {
          str().prepend(`${banner}\n`)
        }
        if (footer) {
          str().append(`${footer}\n`)
        }

        if (s) {
          return {
            code: s.toString(),
            map: s.generateMap({ hires: 'boundary' }),
          }
        }
      }
    },
  }
}
