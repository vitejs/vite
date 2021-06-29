import { ResolvedServerOptions, ServerOptions } from '../../node';

export function resolveServerOptions(
  root: string,
  raw?: ServerOptions
): ResolvedServerOptions {
  const server = raw || {}
  const fsServeRoot = root

  // TODO: make strict by default
  const fsServeStrict = server.fsServe?.strict ?? false
  server.fsServe = {
    root: fsServeRoot,
    strict: fsServeStrict
  }
  return server as ResolvedServerOptions
}
