import { SFCDescriptor } from '@vue/compiler-sfc'
import { TransformPluginContext } from 'rollup'
import { ResolvedOptions } from '.'
import { compiler } from './compiler'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function transformStyle(
  code: string,
  descriptor: SFCDescriptor,
  index: number,
  options: ResolvedOptions,
  pluginContext: TransformPluginContext
) {
  const block = descriptor.styles[index]
  // vite already handles pre-processors and CSS module so this is only
  // applying SFC-specific transforms like scoped mode and CSS vars rewrite (v-bind(var))
  const result = await compiler.compileStyleAsync({
    ...options.style,
    filename: descriptor.filename,
    id: `data-v-${descriptor.id}`,
    isProd: options.isProduction,
    source: code,
    scoped: block.scoped
  })

  if (result.errors.length) {
    result.errors.forEach((error: any) => {
      if (error.line && error.column) {
        error.loc = {
          file: descriptor.filename,
          line: error.line + block.loc.start.line,
          column: error.column
        }
      }
      pluginContext.error(error)
    })
    return null
  }

  return {
    code: result.code,
    map: result.map || ({ mappings: '' } as any)
  }
}
