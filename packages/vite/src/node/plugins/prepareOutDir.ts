import fs from 'node:fs'
import path from 'node:path'
import colors from 'picocolors'
import type { Plugin } from '../plugin'
import { getResolvedOutDirs, resolveEmptyOutDir } from '../watch'
import type { Environment } from '../environment'
import { copyDir, emptyDir, normalizePath } from '../utils'
import { withTrailingSlash } from '../../shared/utils'

export function prepareOutDirPlugin(): Plugin {
  const rendered = new Set<Environment>()
  return {
    name: 'vite:prepare-out-dir',
    options() {
      rendered.delete(this.environment)
    },
    renderStart: {
      order: 'pre',
      handler() {
        if (rendered.has(this.environment)) {
          return
        }
        rendered.add(this.environment)

        const { config } = this.environment
        if (config.build.write) {
          const { root, build: options } = config
          const resolvedOutDirs = getResolvedOutDirs(
            root,
            options.outDir,
            options.rollupOptions.output,
          )
          const emptyOutDir = resolveEmptyOutDir(
            options.emptyOutDir,
            root,
            resolvedOutDirs,
            this.environment.logger,
          )
          prepareOutDir(resolvedOutDirs, emptyOutDir, this.environment)
        }
      },
    },
  }
}

function prepareOutDir(
  outDirs: Set<string>,
  emptyOutDir: boolean | null,
  environment: Environment,
) {
  const { publicDir } = environment.config
  const outDirsArray = [...outDirs]
  for (const outDir of outDirs) {
    if (emptyOutDir !== false && fs.existsSync(outDir)) {
      // skip those other outDirs which are nested in current outDir
      const skipDirs = outDirsArray
        .map((dir) => {
          const relative = path.relative(outDir, dir)
          if (
            relative &&
            !relative.startsWith('..') &&
            !path.isAbsolute(relative)
          ) {
            return relative
          }
          return ''
        })
        .filter(Boolean)
      emptyDir(outDir, [...skipDirs, '.git'])
    }
    if (
      environment.config.build.copyPublicDir &&
      publicDir &&
      fs.existsSync(publicDir)
    ) {
      if (!areSeparateFolders(outDir, publicDir)) {
        environment.logger.warn(
          colors.yellow(
            `\n${colors.bold(
              `(!)`,
            )} The public directory feature may not work correctly. outDir ${colors.white(
              colors.dim(outDir),
            )} and publicDir ${colors.white(
              colors.dim(publicDir),
            )} are not separate folders.\n`,
          ),
        )
      }
      copyDir(publicDir, outDir)
    }
  }
}

function areSeparateFolders(a: string, b: string) {
  const na = normalizePath(a)
  const nb = normalizePath(b)
  return (
    na !== nb &&
    !na.startsWith(withTrailingSlash(nb)) &&
    !nb.startsWith(withTrailingSlash(na))
  )
}
