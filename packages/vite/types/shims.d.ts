declare module 'connect' {
  const connect: () => any
  export = connect
}

declare module 'cors' {
  function cors(options: any): any
  export = cors
}

declare module 'selfsigned' {
  export function generate(attrs: any, options: any, done?: any): any
}

declare module 'http-proxy' {
  const proxy: any
  export = proxy
}

declare module 'acorn-class-fields' {
  const plugin: any
  export = plugin
}

declare module 'connect-history-api-fallback' {
  const plugin: any
  export = plugin
}

declare module 'launch-editor-middleware' {
  const plugin: any
  export = plugin
}

declare module 'merge-source-map' {
  export default function merge(oldMap: object, newMap: object): object
}

declare module 'postcss-load-config' {
  import { ProcessOptions, Plugin } from 'postcss'
  function load(
    inline: any,
    root: string
  ): Promise<{
    options: ProcessOptions
    plugins: Plugin[]
  }>
  export = load
}

declare module 'postcss-import' {
  import { Plugin } from 'postcss'
  const plugin: () => Plugin
  export = plugin
}

declare module 'postcss-modules' {
  import { Plugin } from 'postcss'
  const plugin: (options: any) => Plugin
  export = plugin
}

declare module '@rollup/plugin-dynamic-import-vars' {
  import { Plugin } from 'rollup'

  interface Options {
    include?: string | RegExp | (string | RegExp)[]
    exclude?: string | RegExp | (string | RegExp)[]
    warnOnError?: boolean
  }

  const p: (o?: Options) => Plugin
  export default p
}

declare module 'rollup-plugin-web-worker-loader' {
  import { Plugin } from 'rollup'

  interface Options {
    targetPlatform?: string
    pattern?: RegExp
    extensions?: string[]
    sourcemap?: boolean
    inline?: boolean
  }

  const p: (o?: Options) => Plugin
  export default p
}

declare module 'isbuiltin' {
  function isBuiltin(moduleName: string): boolean
  export default isBuiltin
}
