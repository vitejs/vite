import type { Plugin } from 'rollup';

export function preCloseBundlePlugin(plugins: Plugin[], preClosePlugins: Plugin[]): Plugin[] {
  plugins.filter(p => typeof p.closeBundle === 'function').forEach(p => {
    const _closeBundle = p.closeBundle
    delete p.closeBundle
    ;(p as any)._closeBundle = _closeBundle
  })
  plugins.push({
    name: 'vite:pre-close-bundle',
    async closeBundle() {
      await Promise.all(preClosePlugins.map(p => (p as any).preCloseBundle?.apply(this)))
      await Promise.all(plugins.map(p => (p as any)._closeBundle?.apply(this)))
    }
  })
  return plugins;
}
