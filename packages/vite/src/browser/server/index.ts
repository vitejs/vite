import type { ResolvedServerOptions, ServerOptions } from '../../node/server';

export function resolveServerOptions(
  root: string,
  raw?: ServerOptions
): ResolvedServerOptions {
  const server = raw || {}
  let allowDirs = server.fs?.allow

  if (!allowDirs) {
    allowDirs = [root]
  }


  server.fs = {
    // TODO: make strict by default
    strict: server.fs?.strict,
    allow: allowDirs
  }
  return server as ResolvedServerOptions
}
