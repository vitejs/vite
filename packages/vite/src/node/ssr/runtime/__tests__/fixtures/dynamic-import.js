import path from 'node:path'
import * as staticModule from './simple'
import { pathToFileURL } from 'node:url'

export const initialize = async () => {
  const nameRelative = './simple'
  const nameAbsolute = '/fixtures/simple'
  const nameAbsoluteExtension = '/fixtures/simple.js'
  const absolutePath = path.join(import.meta.dirname, "simple.js")
  const fileUrl = pathToFileURL(absolutePath)
  return {
    dynamicProcessed: await import('./simple'),
    dynamicRelative: await import(nameRelative),
    dynamicAbsolute: await import(nameAbsolute),
    dynamicAbsoluteExtension: await import(nameAbsoluteExtension),
    dynamicAbsoluteFull: await import((process.platform === 'win32' ? '/@fs/' : '') + absolutePath),
    dynamicFileUrl: await import(fileUrl),
    static: staticModule,
  }
}
