import type { Plugin as RollupPlugin } from 'rollup'
import type { Plugin } from '../plugin'

export function preCloseBundlePlugin(
  plugins: RollupPlugin[],
  preClosePlugins: RollupPlugin[]
): RollupPlugin[] {
  plugins
    .filter((p) => typeof p.closeBundle === 'function')
    .forEach((p) => {
      const _closeBundle = p.closeBundle
      delete p.closeBundle
      ;(p as any)._closeBundle = _closeBundle
    })
  plugins.push(<Plugin>{
    name: 'vite:pre-close-bundle',
    apply: 'build',
    async closeBundle() {
      await Promise.all(
        preClosePlugins.map((p) => (p as any).preCloseBundle?.apply(this))
      )
      await Promise.all(
        plugins.map((p) => (p as any)._closeBundle?.apply(this))
      )
    }
  })
  return plugins
}
