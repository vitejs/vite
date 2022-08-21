// Inlined to avoid extra dependency
// MIT Licensed https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/LICENSE

// Type definitions for connect v3.4.0
// Project: https://github.com/senchalabs/connect
// Definitions by: Maxime LUCE <https://github.com/SomaticIT>
//                 Evan Hahn <https://github.com/EvanHahn>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

/// <reference types="node" />
import * as http from 'node:http'

export namespace Connect {
  export type ServerHandle = HandleFunction | http.Server

  export class IncomingMessage extends http.IncomingMessage {
    originalUrl?: http.IncomingMessage['url'] | undefined
  }

  export type NextFunction = (err?: any) => void

  export type SimpleHandleFunction = (
    req: IncomingMessage,
    res: http.ServerResponse
  ) => void
  export type NextHandleFunction = (
    req: IncomingMessage,
    res: http.ServerResponse,
    next: NextFunction
  ) => void
  export type ErrorHandleFunction = (
    err: any,
    req: IncomingMessage,
    res: http.ServerResponse,
    next: NextFunction
  ) => void
  export type HandleFunction =
    | SimpleHandleFunction
    | NextHandleFunction
    | ErrorHandleFunction

  export interface ServerStackItem {
    route: string
    handle: ServerHandle
  }

  export interface Server extends NodeJS.EventEmitter {
    (req: http.IncomingMessage, res: http.ServerResponse, next?: Function): void

    route: string
    stack: ServerStackItem[]

    /**
     * Utilize the given middleware `handle` to the given `route`,
     * defaulting to _/_. This "route" is the mount-point for the
     * middleware, when given a value other than _/_ the middleware
     * is only effective when that segment is present in the request's
     * pathname.
     *
     * For example if we were to mount a function at _/admin_, it would
     * be invoked on _/admin_, and _/admin/settings_, however it would
     * not be invoked for _/_, or _/posts_.
     */
    use(fn: NextHandleFunction): Server
    use(fn: HandleFunction): Server
    use(route: string, fn: NextHandleFunction): Server
    use(route: string, fn: HandleFunction): Server

    /**
     * Handle server requests, punting them down
     * the middleware stack.
     */
    handle(
      req: http.IncomingMessage,
      res: http.ServerResponse,
      next: Function
    ): void

    /**
     * Listen for connections.
     *
     * This method takes the same arguments
     * as node's `http.Server#listen()`.
     *
     * HTTP and HTTPS:
     *
     * If you run your application both as HTTP
     * and HTTPS you may wrap them individually,
     * since your Connect "server" is really just
     * a JavaScript `Function`.
     *
     *      var connect = require('connect')
     *        , http = require('http')
     *        , https = require('https');
     *
     *      var app = connect();
     *
     *      http.createServer(app).listen(80);
     *      https.createServer(options, app).listen(443);
     */
    listen(
      port: number,
      hostname?: string,
      backlog?: number,
      callback?: Function
    ): http.Server
    listen(port: number, hostname?: string, callback?: Function): http.Server
    listen(path: string, callback?: Function): http.Server
    listen(handle: any, listeningListener?: Function): http.Server
  }
}
