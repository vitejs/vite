import type { Plugin } from '../plugin'
import { dataUrlRE, externalRE, isDataUrl, isExternalUrl } from '../utils'

export function externalizeUrlPlugin(): Plugin {
  return {
    name: 'vite:externalize-url',
    applyToEnvironment(environment) {
      return !environment.config.isBundled
    },
    // Force externalization before user resolvers for now: the native resolver
    // can resolve protocol-relative URLs as files and lets data URLs fall through.
    // TODO: Let the native resolver skip remote URLs during dev, then move this
    // to a post fallback so user plugins can override URL externalization.
    resolveId: {
      filter: {
        id: {
          include: [externalRE, dataUrlRE],
          exclude: /^file:\/\//,
        },
      },
      handler(id) {
        // Note: hook filters normalize backslashes, we need to still keep this check
        if ((isExternalUrl(id) && !id.startsWith('file://')) || isDataUrl(id)) {
          return { id, external: true }
        }
      },
    },
  }
}
