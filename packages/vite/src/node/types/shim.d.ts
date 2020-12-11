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
