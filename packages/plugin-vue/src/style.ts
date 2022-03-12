import type { SFCDescriptor } from 'vue/compiler-sfc'
import type { TransformPluginContext } from 'rollup'
import type { ResolvedOptions } from '.'
import { formatPostcssSourceMap } from 'vite'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function transformStyle(
  code: string,
  descriptor: SFCDescriptor,
  index: number,
  options: ResolvedOptions,
  pluginContext: TransformPluginContext,
  filename: string
) {
  const block = descriptor.styles[index]
  // vite already handles pre-processors and CSS module so this is only
  // applying SFC-specific transforms like scoped mode and CSS vars rewrite (v-bind(var))
  const result = await options.compiler.compileStyleAsync({
    ...options.style,
    filename: descriptor.filename,
    id: `data-v-${descriptor.id}`,
    isProd: options.isProduction,
    source: code,
    scoped: block.scoped,
    postcssOptions: {
      map: {
        from: filename,
        inline: false,
        annotation: false
      }
    }
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

  const map = result.map
    ? formatPostcssSourceMap({ ...result.map, version: 3 }, filename)
    : ({ mappings: '' } as any)

  return {
    code: result.code,
    map: map
  }
}
