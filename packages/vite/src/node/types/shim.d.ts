declare module 'cors' {
  function cors(options: any): any
  export = cors
}

declare module 'selfsigned' {
  export function generate(attrs: any, options: any, done?: any): any
}

declare module 'acorn-class-fields' {
  const plugin: any
  export = plugin
}
