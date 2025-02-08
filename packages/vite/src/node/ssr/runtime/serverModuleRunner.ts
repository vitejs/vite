import { existsSync, readFileSync } from 'node:fs'
import { ModuleRunner } from 'vite/module-runner'
import type {
  ModuleEvaluator,
  ModuleRunnerHmr,
  ModuleRunnerOptions,
} from 'vite/module-runner'
import type { HotPayload } from 'types/hmrPayload'
import type { DevEnvironment } from '../../server/environment'
import type {
  HotChannelClient,
  NormalizedServerHotChannel,
} from '../../server/hmr'
import type { ModuleRunnerTransport } from '../../../shared/moduleRunnerTransport'

/**
 * @experimental
 */
export interface ServerModuleRunnerOptions
  extends Omit<
    ModuleRunnerOptions,
    'root' | 'fetchModule' | 'hmr' | 'transport'
  > {
  /**
   * Disable HMR or configure HMR logger.
   */
  hmr?:
    | false
    | {
        logger?: ModuleRunnerHmr['logger']
      }
  /**
   * Provide a custom module evaluator. This controls how the code is executed.
   */
  evaluator?: ModuleEvaluator
}

function createHMROptions(
  environment: DevEnvironment,
  options: ServerModuleRunnerOptions,
) {
  if (environment.config.server.hmr === false || options.hmr === false) {
    return false
  }
  if (!('api' in environment.hot)) return false
  return {
    logger: options.hmr?.logger,
  }
}

const prepareStackTrace = {
  retrieveFile(id: string) {
    if (existsSync(id)) {
      return readFileSync(id, 'utf-8')
    }
  },
}

function resolveSourceMapOptions(options: ServerModuleRunnerOptions) {
  if (options.sourcemapInterceptor != null) {
    if (options.sourcemapInterceptor === 'prepareStackTrace') {
      return prepareStackTrace
    }
    if (typeof options.sourcemapInterceptor === 'object') {
      return { ...prepareStackTrace, ...options.sourcemapInterceptor }
    }
    return options.sourcemapInterceptor
  }
  if (typeof process !== 'undefined' && 'setSourceMapsEnabled' in process) {
    return 'node'
  }
  return prepareStackTrace
}

export const createServerModuleRunnerTransport = (options: {
  channel: NormalizedServerHotChannel
}): ModuleRunnerTransport => {
  const hmrClient: HotChannelClient = {
    send: (payload: HotPayload) => {
      if (payload.type !== 'custom') {
        throw new Error(
          'Cannot send non-custom events from the client to the server.',
        )
      }
      options.channel.send(payload)
    },
  }

  let handler: ((data: HotPayload) => void) | undefined

  return {
    connect({ onMessage }) {
      options.channel.api!.outsideEmitter.on('send', onMessage)
      onMessage({ type: 'connected' })
      handler = onMessage
    },
    disconnect() {
      if (handler) {
        options.channel.api!.outsideEmitter.off('send', handler)
      }
    },
    send(payload) {
      if (payload.type !== 'custom') {
        throw new Error(
          'Cannot send non-custom events from the server to the client.',
        )
      }
      options.channel.api!.innerEmitter.emit(
        payload.event,
        payload.data,
        hmrClient,
      )
    },
  }
}

/**
 * Create an instance of the Vite SSR runtime that support HMR.
 * @experimental
 */
export function createServerModuleRunner(
  environment: DevEnvironment,
  options: ServerModuleRunnerOptions = {},
): ModuleRunner {
  const hmr = createHMROptions(environment, options)
  return new ModuleRunner(
    {
      ...options,
      root: environment.config.root,
      transport: createServerModuleRunnerTransport({
        channel: environment.hot as NormalizedServerHotChannel,
      }),
      hmr,
      sourcemapInterceptor: resolveSourceMapOptions(options),
    },
    options.evaluator,
  )
}
