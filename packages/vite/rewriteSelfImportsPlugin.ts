import type { Plugin } from 'rolldown'
import pkg from './package.json' with { type: 'json' }

/**
 * The bundles import `vite/module-runner` from this same package. When it is
 * published under another name (e.g. `@paul-browne/vite`), point those imports
 * at that name so they self-resolve instead of reaching an unrelated `vite`.
 * Runs last so the type bundle's own checks still see `vite/module-runner`.
 */
export function rewriteSelfImportsPlugin(): Plugin {
  return {
    name: 'rewrite-self-imports',
    generateBundle: {
      order: 'post',
      handler(_opts, bundle) {
        if (pkg.name === 'vite') return
        for (const chunk of Object.values(bundle)) {
          if (chunk.type !== 'chunk') continue
          chunk.code = chunk.code.replace(
            /(["'])vite\/module-runner\1/g,
            `$1${pkg.name}/module-runner$1`,
          )
        }
      },
    },
  }
}
