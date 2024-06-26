export interface FindResult<T> {
  params: { [k: string]: string }
  handlers: T[]
}

export type HTTPMethod =
  | 'ACL'
  | 'BIND'
  | 'CHECKOUT'
  | 'CONNECT'
  | 'COPY'
  | 'DELETE'
  | 'GET'
  | 'HEAD'
  | 'LINK'
  | 'LOCK'
  | 'M-SEARCH'
  | 'MERGE'
  | 'MKACTIVITY'
  | 'MKCALENDAR'
  | 'MKCOL'
  | 'MOVE'
  | 'NOTIFY'
  | 'OPTIONS'
  | 'PATCH'
  | 'POST'
  | 'PROPFIND'
  | 'PROPPATCH'
  | 'PURGE'
  | 'PUT'
  | 'REBIND'
  | 'REPORT'
  | 'SEARCH'
  | 'SOURCE'
  | 'SUBSCRIBE'
  | 'TRACE'
  | 'UNBIND'
  | 'UNLINK'
  | 'UNLOCK'
  | 'UNSUBSCRIBE'

export class Trouter<T = any> {
  use(pattern: string | RegExp, ...handlers: T[]): this

  find(method: HTTPMethod, url: string): FindResult<T>

  add(method: HTTPMethod, pattern: string | RegExp, ...handlers: T[]): this

  all(pattern: string | RegExp, ...handlers: T[]): this

  get(pattern: string | RegExp, ...handlers: T[]): this

  head(pattern: string | RegExp, ...handlers: T[]): this

  patch(pattern: string | RegExp, ...handlers: T[]): this

  options(pattern: string | RegExp, ...handlers: T[]): this

  connect(pattern: string | RegExp, ...handlers: T[]): this

  delete(pattern: string | RegExp, ...handlers: T[]): this

  trace(pattern: string | RegExp, ...handlers: T[]): this

  post(pattern: string | RegExp, ...handlers: T[]): this

  put(pattern: string | RegExp, ...handlers: T[]): this
}
