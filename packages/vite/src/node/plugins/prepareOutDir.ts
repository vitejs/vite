import fs from 'node:fs'
import path from 'node:path'
import { ignoreInput } from '@voidzero-dev/vite-task-client'
import colors from 'picocolors'
import { withTrailingSlash } from '../../shared/utils'
import type { Environment } from '../environment'
import type { Plugin } from '../plugin'
import { copyDir, emptyDir, normalizePath } from '../utils'
import { getResolvedOutDirs, resolveEmptyOutDir } from '../watch'

export function prepareOutDirPlugin(): Plugin {
  const rendered = new Set<Environment>()
  return {
    name: 'vite:prepare-out-dir',
    buildStart() {
      // In watch mode, a change in the public directory must trigger a
      // rebuild so renderStart below re-copies it. Rolldown only watches the
      // module graph, so register the public directory itself: watching the
      // directory (rather than each file in it) also covers files added after
      // the first build, and deletions.
      const { publicDir, build } = this.environment.config
      if (build.copyPublicDir && publicDir && fs.existsSync(publicDir)) {
        this.addWatchFile(publicDir)
      }
    },
    watchChange(id) {
      rendered.delete(this.environment)
      // If a watched public file was deleted, remove its stale copy from the
      // output directory. When emptyOutDir is enabled renderStart below
      // already clears the output directory, so this only matters when it is
      // disabled — but it is cheap and correct in both cases.
      const { publicDir, build, root } = this.environment.config
      if (!build.copyPublicDir || !publicDir || !id) {
        return
      }
      const normalizedId = normalizePath(id)
      const normalizedPublicDir = normalizePath(publicDir)
      if (
        normalizedId === normalizedPublicDir ||
        !normalizedId.startsWith(withTrailingSlash(normalizedPublicDir)) ||
        fs.existsSync(normalizedId)
      ) {
        return
      }
      const relative = path.relative(normalizedPublicDir, normalizedId)
      for (const outDir of getResolvedOutDirs(
        root,
        build.outDir,
        build.rolldownOptions.output,
      )) {
        fs.rmSync(path.join(outDir, relative), { force: true })
      }
    },
    renderStart: {
      order: 'pre',
      handler() {
        if (rendered.has(this.environment)) {
          return
        }

        const { config } = this.environment
        if (config.build.write) {
          rendered.add(this.environment)
          const { root, build: options } = config
          const resolvedOutDirs = getResolvedOutDirs(
            root,
            options.outDir,
            options.rolldownOptions.output,
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
    // When run inside Vite Task, `emptyDir` below reads the entries of
    // `outDir`. Without this, those reads would be recorded as build inputs
    // and mix with the writes that follow, tripping Vite Task's read-write
    // overlap check.
    ignoreInput(outDir)
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
