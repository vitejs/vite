import type { ResolvedConfig } from '../../config'
import type { DevEnvironmentContext } from '../environment'
import { DevEnvironment } from '../environment'
import type { Environment } from '../../environment'

export interface FetchableDevEnvironmentContext extends DevEnvironmentContext {
  handleRequest(request: Request): Promise<Response> | Response
}

export function createFetchableDevEnvironment(
  name: string,
  config: ResolvedConfig,
  context: FetchableDevEnvironmentContext,
): FetchableDevEnvironment {
  if (typeof Request === 'undefined' || typeof Response === 'undefined') {
    throw new TypeError(
      'FetchableDevEnvironment requires a global `Request` and `Response` object.',
    )
  }

  if (!context.handleRequest) {
    throw new TypeError(
      'FetchableDevEnvironment requires a `handleRequest` method during initialisation.',
    )
  }

  return new FetchableDevEnvironment(name, config, context)
}

export function isFetchableDevEnvironment(
  environment: Environment,
): environment is FetchableDevEnvironment {
  return environment instanceof FetchableDevEnvironment
}

class FetchableDevEnvironment extends DevEnvironment {
  private _handleRequest: (request: Request) => Promise<Response> | Response

  constructor(
    name: string,
    config: ResolvedConfig,
    context: FetchableDevEnvironmentContext,
  ) {
    super(name, config, context)
    this._handleRequest = context.handleRequest
  }

  public async dispatchFetch(request: Request): Promise<Response> {
    if (!(request instanceof Request)) {
      throw new TypeError(
        'FetchableDevEnvironment `dispatchFetch` must receive a `Request` object.',
      )
    }
    const response = await this._handleRequest(request)
    if (!(response instanceof Response)) {
      throw new TypeError(
        'FetchableDevEnvironment `context.handleRequest` must return a `Response` object.',
      )
    }
    return response
  }
}

export type { FetchableDevEnvironment }
