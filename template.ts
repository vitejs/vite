import { SFCBlock, compileTemplate } from '@vue/component-compiler-utils'
import * as vueTemplateCompiler from 'vue-template-compiler'
import path from 'path'
import { TransformPluginContext } from 'rollup'
import { ResolvedOptions } from './index'

export function compileSFCTemplate(
  source: string,
  block: SFCBlock,
  filename: string,
  { root, isProduction, vueTemplateOptions, devServer }: ResolvedOptions,
  pluginContext: TransformPluginContext
): string {
  const { tips, errors, code } = compileTemplate({
    source,
    filename,
    compiler: vueTemplateCompiler as any,
    transformAssetUrls: true,
    transformAssetUrlsOptions: devServer
      ? {
          base: path.posix.dirname(path.relative(root, filename)),
        }
      : {},
    isProduction,
    isFunctional: !!block.attrs.functional,
    optimizeSSR: false,
    prettify: false,
    ...vueTemplateOptions,
  })

  if (tips) {
    tips.forEach(console.warn)
  }

  // todo
  if (errors) {
    // 	errors.forEach((e) => pluginContext.error(e))
  }

  if (devServer) {
    return code + `\nexport { render, staticRenderFns }`
  }
  // rewrite require calls to import on build
  return transformRequireToImport(code) + `\nexport { render, staticRenderFns }`
}

export function transformRequireToImport(code: string): string {
  const imports: { [key: string]: string } = {}
  let strImports = ''

  code = code.replace(
    /require\(("(?:[^"\\]|\\.)+"|'(?:[^'\\]|\\.)+')\)/g,
    (_, name): any => {
      if (!(name in imports)) {
        imports[name] = `__$_require_${name
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_{2,}/g, '_')
          .replace(/^_|_$/g, '')}__`
        strImports += 'import ' + imports[name] + ' from ' + name + '\n'
      }

      return imports[name]
    }
  )

  return strImports + code
}
