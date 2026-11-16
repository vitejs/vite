declare module 'connect' {
  const connect: () => any
  export = connect
}

declare module 'cors' {
  function cors(options: any): any
  export = cors
}

declare module 'postcss-import' {
  import type { Plugin } from 'postcss'
  const plugin: (options: {
    resolve: (
      id: string,
      basedir: string,
      importOptions: any,
      atRule: import('postcss').AtRule,
    ) => string | string[] | Promise<string | string[]>
    load: (id: string) => Promise<string>
    nameLayer: (index: number, rootFilename: string) => string
  }) => Plugin
  export = plugin
}

// declare it here as it's an optional dependency and is not installed on non-Windows platforms
declare module 'napi-windows-process-start-time' {
  export function getProcessStartTime(pid: number): `win32:${string}` | null
}

// eslint-disable-next-line no-var
declare var __vite_profile_session: import('node:inspector').Session | undefined
// eslint-disable-next-line no-var
declare var __vite_profile_name: string | undefined
// eslint-disable-next-line no-var
declare var __vite_start_time: number | undefined
