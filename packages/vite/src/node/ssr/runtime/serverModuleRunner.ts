import { existsSync, readFileSync } from 'node:fs'
import { ESModulesEvaluator, ModuleRunner } from 'vite/module-runner'
import type {
  ModuleEvaluator,
  ModuleRunnerHmr,
  ModuleRunnerOptions,
} from 'vite/module-runner'
import type { HotPayload } from 'types/hmrPayload'
import type { DevEnvironment } from '../../server/environment'
import type { HotChannelClient, ServerHotChannel } from '../../server/hmr'
import type { CreateRunnerTransport } from '../../../shared/runnerTransport'

/**
 * @experimental
 */
export interface ServerModuleRunnerOptions
  extends Omit<
    ModuleRunnerOptions,
    'root' | 'fetchModule' | 'hmr' | 'createTransport'
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

class ServerHMRBroadcasterClient implements HotChannelClient {
  constructor(private readonly hotChannel: ServerHotChannel) {}

  send(...args: any[]) {
    let payload: HotPayload
    if (typeof args[0] === 'string') {
      payload = {
        type: 'custom',
        event: args[0],
        data: args[1],
      }
    } else {
      payload = args[0]
    }
    if (payload.type !== 'custom') {
      throw new Error(
        'Cannot send non-custom events from the client to the server.',
      )
    }
    this.hotChannel.send(payload)
  }

  respond(
    event: string,
    invoke: 'response' | `response:${string}` | undefined,
    payload?: any,
  ) {
    this.hotChannel.send({
      type: 'custom',
      event,
      invoke,
      data: payload,
    })
  }
}

export const createServerRunnerTransportOptions =
  (options: { channel: ServerHotChannel }): CreateRunnerTransport =>
  () => {
    const hmrClient = new ServerHMRBroadcasterClient(options.channel)
    let handler: ((data: HotPayload) => void) | undefined

    return {
      connect(handler) {
        options.channel.api.outsideEmitter.on('send', handler)
        handler({ type: 'connected' })
      },
      disconnect() {
        if (handler) {
          options.channel.api.outsideEmitter.off('send', handler)
        }
      },
      send(payload) {
        if (payload.type !== 'custom') {
          throw new Error(
            'Cannot send non-custom events from the server to the client.',
          )
        }
        options.channel.api.innerEmitter.emit(
          payload.event,
          payload.data,
          hmrClient,
          payload.invoke,
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
      createTransport: createServerRunnerTransportOptions({
        channel: environment.transport as ServerHotChannel,
      }),
      hmr,
      sourcemapInterceptor: resolveSourceMapOptions(options),
    },
    options.evaluator || new ESModulesEvaluator(),
  )
}
