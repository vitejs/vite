// Inlined to avoid extra dependency
// MIT Licensed https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/LICENSE

// Type definitions for node-http-proxy 1.17
// Project: https://github.com/nodejitsu/node-http-proxy
// Definitions by: Maxime LUCE <https://github.com/SomaticIT>
//                 Florian Oellerich <https://github.com/Raigen>
//                 Daniel Schmidt <https://github.com/DanielMSchmidt>
//                 Jordan Abreu <https://github.com/jabreu610>
//                 Samuel Bodin <https://github.com/bodinsamuel>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.1

/// <reference types="node" />

import type * as net from 'node:net'
import type * as http from 'node:http'
import * as events from 'node:events'
import type * as url from 'node:url'
import type * as stream from 'node:stream'

export namespace HttpProxy {
  export type ProxyTarget = ProxyTargetUrl | ProxyTargetDetailed

  export type ProxyTargetUrl = string | Partial<url.Url>

  export interface ProxyTargetDetailed {
    host: string
    port: number
    protocol?: string | undefined
    hostname?: string | undefined
    socketPath?: string | undefined
    key?: string | undefined
    passphrase?: string | undefined
    pfx?: Buffer | string | undefined
    cert?: string | undefined
    ca?: string | undefined
    ciphers?: string | undefined
    secureProtocol?: string | undefined
  }

  export type ErrorCallback = (
    err: Error,
    req: http.IncomingMessage,
    res: http.ServerResponse,
    target?: ProxyTargetUrl
  ) => void

  export class Server extends events.EventEmitter {
    /**
     * Creates the proxy server with specified options.
     * @param options - Config object passed to the proxy
     */
    constructor(options?: ServerOptions)

    /**
     * Used for proxying regular HTTP(S) requests
     * @param req - Client request.
     * @param res - Client response.
     * @param options - Additionnal options.
     */
    web(
      req: http.IncomingMessage,
      res: http.ServerResponse,
      options?: ServerOptions,
      callback?: ErrorCallback
    ): void

    /**
     * Used for proxying regular HTTP(S) requests
     * @param req - Client request.
     * @param socket - Client socket.
     * @param head - Client head.
     * @param options - Additional options.
     */
    ws(
      req: http.IncomingMessage,
      socket: unknown,
      head: unknown,
      options?: ServerOptions,
      callback?: ErrorCallback
    ): void

    /**
     * A function that wraps the object in a webserver, for your convenience
     * @param port - Port to listen on
     */
    listen(port: number): Server

    /**
     * A function that closes the inner webserver and stops listening on given port
     */
    close(callback?: () => void): void

    /**
     * Creates the proxy server with specified options.
     * @param options - Config object passed to the proxy
     * @returns Proxy object with handlers for `ws` and `web` requests
     */
    static createProxyServer(options?: ServerOptions): Server

    /**
     * Creates the proxy server with specified options.
     * @param options - Config object passed to the proxy
     * @returns Proxy object with handlers for `ws` and `web` requests
     */
    static createServer(options?: ServerOptions): Server

    /**
     * Creates the proxy server with specified options.
     * @param options - Config object passed to the proxy
     * @returns Proxy object with handlers for `ws` and `web` requests
     */
    static createProxy(options?: ServerOptions): Server

    addListener(event: string, listener: () => void): this
    on(event: string, listener: () => void): this
    on(event: 'error', listener: ErrorCallback): this
    on(
      event: 'start',
      listener: (
        req: http.IncomingMessage,
        res: http.ServerResponse,
        target: ProxyTargetUrl
      ) => void
    ): this
    on(
      event: 'proxyReq',
      listener: (
        proxyReq: http.ClientRequest,
        req: http.IncomingMessage,
        res: http.ServerResponse,
        options: ServerOptions
      ) => void
    ): this
    on(
      event: 'proxyRes',
      listener: (
        proxyRes: http.IncomingMessage,
        req: http.IncomingMessage,
        res: http.ServerResponse
      ) => void
    ): this
    on(
      event: 'proxyReqWs',
      listener: (
        proxyReq: http.ClientRequest,
        req: http.IncomingMessage,
        socket: net.Socket,
        options: ServerOptions,
        head: any
      ) => void
    ): this
    on(
      event: 'econnreset',
      listener: (
        err: Error,
        req: http.IncomingMessage,
        res: http.ServerResponse,
        target: ProxyTargetUrl
      ) => void
    ): this
    on(
      event: 'end',
      listener: (
        req: http.IncomingMessage,
        res: http.ServerResponse,
        proxyRes: http.IncomingMessage
      ) => void
    ): this
    on(
      event: 'close',
      listener: (
        proxyRes: http.IncomingMessage,
        proxySocket: net.Socket,
        proxyHead: any
      ) => void
    ): this

    once(event: string, listener: () => void): this
    removeListener(event: string, listener: () => void): this
    removeAllListeners(event?: string): this
    getMaxListeners(): number
    setMaxListeners(n: number): this
    listeners(event: string): Array<() => void>
    emit(event: string, ...args: any[]): boolean
    listenerCount(type: string): number
  }

  export interface ServerOptions {
    /** URL string to be parsed with the url module. */
    target?: ProxyTarget | undefined
    /** URL string to be parsed with the url module. */
    forward?: ProxyTargetUrl | undefined
    /** Object to be passed to http(s).request. */
    agent?: any
    /** Object to be passed to https.createServer(). */
    ssl?: any
    /** If you want to proxy websockets. */
    ws?: boolean | undefined
    /** Adds x- forward headers. */
    xfwd?: boolean | undefined
    /** Verify SSL certificate. */
    secure?: boolean | undefined
    /** Explicitly specify if we are proxying to another proxy. */
    toProxy?: boolean | undefined
    /** Specify whether you want to prepend the target's path to the proxy path. */
    prependPath?: boolean | undefined
    /** Specify whether you want to ignore the proxy path of the incoming request. */
    ignorePath?: boolean | undefined
    /** Local interface string to bind for outgoing connections. */
    localAddress?: string | undefined
    /** Changes the origin of the host header to the target URL. */
    changeOrigin?: boolean | undefined
    /** specify whether you want to keep letter case of response header key */
    preserveHeaderKeyCase?: boolean | undefined
    /** Basic authentication i.e. 'user:password' to compute an Authorization header. */
    auth?: string | undefined
    /** Rewrites the location hostname on (301 / 302 / 307 / 308) redirects, Default: null. */
    hostRewrite?: string | undefined
    /** Rewrites the location host/ port on (301 / 302 / 307 / 308) redirects based on requested host/ port.Default: false. */
    autoRewrite?: boolean | undefined
    /** Rewrites the location protocol on (301 / 302 / 307 / 308) redirects to 'http' or 'https'.Default: null. */
    protocolRewrite?: string | undefined
    /** rewrites domain of set-cookie headers. */
    cookieDomainRewrite?:
      | false
      | string
      | { [oldDomain: string]: string }
      | undefined
    /** rewrites path of set-cookie headers. Default: false */
    cookiePathRewrite?:
      | false
      | string
      | { [oldPath: string]: string }
      | undefined
    /** object with extra headers to be added to target requests. */
    headers?: { [header: string]: string } | undefined
    /** Timeout (in milliseconds) when proxy receives no response from target. Default: 120000 (2 minutes) */
    proxyTimeout?: number | undefined
    /** Timeout (in milliseconds) for incoming requests */
    timeout?: number | undefined
    /** Specify whether you want to follow redirects. Default: false */
    followRedirects?: boolean | undefined
    /** If set to true, none of the webOutgoing passes are called and it's your responsibility to appropriately return the response by listening and acting on the proxyRes event */
    selfHandleResponse?: boolean | undefined
    /** Buffer */
    buffer?: stream.Stream | undefined
  }
}
