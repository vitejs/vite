import path from 'node:path'
import { type ImportSpecifier, initSync, parse } from 'es-module-lexer'
import type { Plugin } from '../plugin'
import { getImportMap } from './html'

/**
 * Sanity-check the finished bundle: none of a chunk's (relative) static or
 * dynamic import specifiers should point at a file this build didn't
 * actually emit. This has no known way to trigger from user code - it's a
 * last-resort net for an internal Vite/Rolldown bug that leaves a chunk's
 * emitted code pointing at a reference the rest of the build's bookkeeping
 * lost track of. A chunk silently pointing at a nonexistent file would only
 * surface as a runtime 404 for users - fail the build instead.
 *
 * Runs last (see `order: 'post'` below) so every other plugin's mutations to
 * the bundle (asset renaming, import rewriting, preload injection, etc.)
 * are already applied by the time this checks it.
 */
export function checkOutputReferencesPlugin(): Plugin {
  return {
    name: 'vite:check-output-references',
    generateBundle: {
      order: 'post',
      handler(opts, bundle) {
        // es-module-lexer only has anything to find in ES module output -
        // cjs/umd/iife (library mode, worker.format: 'iife', a legacy
        // build's SystemJS pass) have no `import`/`export` syntax to parse,
        // the same gate `vite:build-import-analysis` already uses.
        if (opts.format !== 'es') return

        // generateBundle can't be async here without forcing every plugin
        // whose hooks run around it to tolerate that. initSync compiles the
        // (tiny, embedded) WASM synchronously - a no-op if some other
        // plugin already `await init`-ed it earlier in this same build,
        // which is normally the case by the time generateBundle runs.
        initSync()

        const config = this.environment.config
        // With `build.chunkImportMap` enabled, Rolldown may legitimately
        // leave a chunk's static import specifiers as "preliminary" names
        // that only resolve to their real file through the import map it
        // generates for the main HTML document - by design, and correct at
        // runtime for any ordinary chunk loaded by a document that sees
        // that import map. Treat a specifier resolvable through the import
        // map as valid too, so this doesn't false-positive on every build
        // that enables the option.
        const mapping = config.build.chunkImportMap
          ? getImportMap(bundle, config)?.mapping
          : undefined

        const violations: {
          fileName: string
          specifier: string
          resolved: string
        }[] = []
        for (const fileName in bundle) {
          const output = bundle[fileName]
          if (output.type !== 'chunk') continue

          let imports: readonly ImportSpecifier[]
          try {
            imports = parse(output.code)[0]
          } catch {
            continue
          }
          for (const { n: specifier } of imports) {
            if (!specifier || !specifier.startsWith('.')) continue
            const resolved = path.posix.normalize(
              path.posix.join(path.posix.dirname(fileName), specifier),
            )
            if (bundle[resolved]) continue
            const real = mapping?.[resolved]
            if (real && bundle[real]) continue
            violations.push({ fileName, specifier, resolved })
          }
        }

        if (violations.length > 0) {
          throw new Error(
            `Internal error: this build produced ${violations.length} ` +
              `broken chunk reference(s):\n` +
              violations
                .map(
                  (v) =>
                    `  - "${v.fileName}" imports "${v.specifier}", which ` +
                    `doesn't match any file this build actually emitted ` +
                    `(resolved to "${v.resolved}")`,
                )
                .join('\n') +
              `\nThis points to a bug in how Vite or Rolldown computed ` +
              `these chunks' references, not in your source code. Please ` +
              `report this at https://github.com/vitejs/vite/issues with ` +
              `your build config.`,
          )
        }
      },
    },
  }
}
