// Inlined to avoid extra dependency
/// <reference types="node" />

import type { IncomingMessage, ServerResponse } from 'node:http'
import type * as net from 'node:net'
import type { Trouter } from './trouter'

type Promisable<T> = Promise<T> | T
type ListenCallback = () => Promisable<void>

interface ParsedURL {
  query?: string
  search?: string
  href: string
  path: string
  pathname: string
}

export declare namespace Polka {
  export interface IError extends Error {
    code?: number
    status?: number
    details?: any
  }

  export type NextHandler = (err?: string | IError) => Promisable<void>
  export type ErrorHandler<T extends Request = Request> = (
    err: string | IError,
    req: T,
    res: Response,
    next: NextHandler,
  ) => Promisable<void>
  export type Middleware<T extends IncomingMessage = Request> = (
    req: T & Request,
    res: Response,
    next: NextHandler,
  ) => Promisable<void>

  export type Response = ServerResponse

  export interface Request extends IncomingMessage {
    url: string
    method: string
    originalUrl: string
    params: Record<string, string>
    path: string
    search: string
    query: Record<string, string>
    body?: any
    _decoded?: true
    _parsedUrl: ParsedURL
  }

  export interface Polka<T extends Request = Request>
    extends Trouter<Middleware<T>> {
    readonly server: net.Server
    wares: Middleware<T>[]

    onError: ErrorHandler<T>
    readonly onNoMatch: Middleware<T>

    readonly handler: Middleware<T>
    parse: (req: IncomingMessage) => ParsedURL

    use(
      pattern: RegExp | string,
      ...handlers: (Polka<T> | Middleware<T>)[]
    ): this
    use(...handlers: (Polka<T> | Middleware<T>)[]): this

    listen(
      port?: number,
      hostname?: string,
      backlog?: number,
      callback?: ListenCallback,
    ): this
    listen(port?: number, hostname?: string, callback?: ListenCallback): this
    listen(port?: number, backlog?: number, callback?: ListenCallback): this
    listen(port?: number, callback?: ListenCallback): this
    listen(path: string, backlog?: number, callback?: ListenCallback): this
    listen(path: string, callback?: ListenCallback): this
    listen(options: net.ListenOptions, callback?: ListenCallback): this
    listen(handle: any, backlog?: number, callback?: ListenCallback): this
    listen(handle: any, callback?: ListenCallback): this

    attach: Middleware<T>
  }
}
