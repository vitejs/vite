import * as staticModule from './basic'

export const initialize = async () => {
  const nameRelative = './basic'
  const nameAbsolute = '/fixtures/basic'
  const nameAbsoluteExtension = '/fixtures/basic.js'
  return {
    dynamicProcessed: await import('./basic'),
    dynamicRelative: await import(nameRelative),
    dynamicAbsolute: await import(nameAbsolute),
    dynamicAbsoluteExtension: await import(nameAbsoluteExtension),
    static: staticModule,
  }
}
