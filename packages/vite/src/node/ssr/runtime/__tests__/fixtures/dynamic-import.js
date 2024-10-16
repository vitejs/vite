import path from 'node:path'
import { pathToFileURL } from 'node:url'
import * as staticModule from './simple'

export const initialize = async () => {
  const nameRelative = './simple'
  const nameAbsolute = '/fixtures/simple'
  const nameAbsoluteExtension = '/fixtures/simple.js'
  const absolutePath = path.join(import.meta.dirname, "simple.js")
  const absoluteFileUrl = pathToFileURL(absolutePath);
  return {
    dynamicProcessed: await import('./simple'),
    dynamicRelative: await import(nameRelative),
    dynamicAbsolute: await import(nameAbsolute),
    dynamicAbsoluteExtension: await import(nameAbsoluteExtension),
    dynamicAbsoluteFull: await import((process.platform === 'win32' ? '/@fs/' : '') + absolutePath),
    dynamicAbsoluteFullUrl: await import(absoluteFileUrl.href),
    static: staticModule,
  }
}
