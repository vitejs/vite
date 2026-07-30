import path from 'node:path'
import { viteReporterPlugin as nativeReporterPlugin } from 'rolldown/experimental'
import { type Plugin, perEnvironmentPlugin } from '../plugin'
import type { ResolvedConfig } from '../config'
import { LogLevels } from '../logger'

export function buildReporterPlugin(config: ResolvedConfig): Plugin {
  return perEnvironmentPlugin('native:reporter', (env) => {
    const tty = process.stdout.isTTY && !process.env.CI
    const shouldLogInfo = LogLevels[config.logLevel || 'info'] >= LogLevels.info
    const assetsDir = path.join(env.config.build.assetsDir, '/')
    return nativeReporterPlugin({
      root: env.config.root,
      isTty: !!tty,
      isLib: !!env.config.build.lib,
      assetsDir,
      chunkLimit: env.config.build.chunkSizeWarningLimit,
      logInfo: shouldLogInfo ? (msg) => env.logger.info(msg) : undefined,
      reportCompressedSize: env.config.build.reportCompressedSize,
      warnLargeChunks:
        env.config.build.minify &&
        !env.config.build.lib &&
        env.config.consumer === 'client',
    })
  })
}
