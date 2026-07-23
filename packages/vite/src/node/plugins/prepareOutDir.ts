import fs from 'node:fs'
import path from 'node:path'
import { ignoreInput } from '@voidzero-dev/vite-task-client'
import colors from 'picocolors'
import type { FSWatcher } from '#dep-types/chokidar'
import type { Plugin } from '../plugin'
import {
  getResolvedOutDirs,
  resolveChokidarOptions,
  resolveEmptyOutDir,
} from '../watch'
import type { Environment } from '../environment'
import { copyDir, emptyDir, normalizePath } from '../utils'
import { withTrailingSlash } from '../../shared/utils'

export function prepareOutDirPlugin(): Plugin {
  const rendered = new Set<Environment>()
  const publicWatchers = new Map<Environment, Promise<FSWatcher | undefined>>()
  return {
    name: 'vite:prepare-out-dir',
    watchChange() {
      rendered.delete(this.environment)
    },
    renderStart: {
      order: 'pre',
      async handler() {
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

          if (options.watch && !publicWatchers.has(this.environment)) {
            const publicWatcherPromise = watchPublicDir(
              this.environment,
              resolvedOutDirs,
              emptyOutDir,
            )
            publicWatchers.set(this.environment, publicWatcherPromise)
            await publicWatcherPromise
          }
        }
      },
    },
    closeWatcher() {
      const publicWatcherPromise = publicWatchers.get(this.environment)
      publicWatchers.delete(this.environment)
      return publicWatcherPromise?.then((watcher) => watcher?.close())
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

/**
 * Watch publicDir for file changes in watch mode and sync them to the out
 * dirs without triggering a full rebuild, since public assets bypass the
 * bundler.
 */
async function watchPublicDir(
  environment: Environment,
  resolvedOutDirs: Set<string>,
  emptyOutDir: boolean,
): Promise<FSWatcher | undefined> {
  const { config, logger } = environment
  const { publicDir, build: options } = config
  if (!publicDir || !options.copyPublicDir || !fs.existsSync(publicDir)) {
    return
  }

  const resolvedChokidarOptions = resolveChokidarOptions(
    {
      // @ts-expect-error chokidar option does not exist in rolldown but used for backward compat
      ...(options.rolldownOptions.watch || {}).chokidar,
      // @ts-expect-error chokidar option does not exist in rolldown but used for backward compat
      ...options.watch?.chokidar,
    },
    resolvedOutDirs,
    emptyOutDir,
    config.cacheDir,
  )

  const { default: chokidar } = await import('chokidar')
  const outDirsArray = [...resolvedOutDirs]

  const syncFile = (file: string, isDelete: boolean) => {
    const relative = path.relative(publicDir, file)
    for (const outDir of outDirsArray) {
      const dest = path.resolve(outDir, relative)
      try {
        if (isDelete) {
          fs.rmSync(dest, { force: true })
        } else {
          fs.mkdirSync(path.dirname(dest), { recursive: true })
          fs.copyFileSync(file, dest)
        }
      } catch (e) {
        logger.error(
          colors.red(
            `error while syncing public file ${JSON.stringify(relative)}: ${e instanceof Error ? e.message : e}`,
          ),
        )
      }
    }
  }

  return chokidar
    .watch(publicDir, {
      // wait for writes to finish before copying, otherwise a file
      // truncated by an in-progress write is copied half-written and
      // never corrected, as chokidar throttles the follow-up event
      awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 10 },
      ...resolvedChokidarOptions,
    })
    .on('add', (file) => syncFile(file, false))
    .on('change', (file) => syncFile(file, false))
    .on('unlink', (file) => syncFile(file, true))
    .on('unlinkDir', (dir) => {
      const relative = path.relative(publicDir, dir)
      for (const outDir of outDirsArray) {
        try {
          fs.rmSync(path.resolve(outDir, relative), {
            recursive: true,
            force: true,
          })
        } catch (e) {
          logger.error(
            colors.red(
              `error while syncing public dir ${JSON.stringify(relative)}: ${e instanceof Error ? e.message : e}`,
            ),
          )
        }
      }
    }) as FSWatcher
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
