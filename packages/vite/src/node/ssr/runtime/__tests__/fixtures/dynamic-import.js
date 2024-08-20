import path from 'node:path'
import * as staticModule from './simple'

export const initialize = async () => {
  const nameRelative = './simple'
  const nameAbsolute = '/fixtures/simple'
  const nameAbsoluteExtension = '/fixtures/simple.js'
  return {
    dynamicProcessed: await import('./simple'),
    dynamicRelative: await import(nameRelative),
    dynamicAbsolute: await import(nameAbsolute),
    dynamicAbsoluteExtension: await import(nameAbsoluteExtension),
    dynamicAbsoluteFull: await import(path.join(import.meta.dirname, "simple.js")),
    static: staticModule,
  }
}
