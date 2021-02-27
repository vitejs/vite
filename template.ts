import { SFCBlock } from '@vue/component-compiler-utils'
import * as vueTemplateCompiler from 'vue-template-compiler'
import { TransformPluginContext } from 'rollup'
import { ResolvedOptions } from './index'
import { createRollupError } from './utils/error'
import { compileTemplate } from './template/compileTemplate'

export function compileSFCTemplate(
  source: string,
  block: SFCBlock,
  filename: string,
  { root, isProduction, vueTemplateOptions = {}, devServer }: ResolvedOptions,
  pluginContext: TransformPluginContext
): string {
  const { tips, errors, code } = compileTemplate({
    source,
    filename,
    compiler: vueTemplateCompiler as any,
    transformAssetUrls: true,
    transformAssetUrlsOptions: {
      forceRequire: true,
    },
    isProduction,
    isFunctional: !!block.attrs.functional,
    optimizeSSR: false,
    prettify: false,
    preprocessLang: block.lang,
    ...vueTemplateOptions,
  })

  if (tips) {
    tips.forEach((warn) =>
      pluginContext.error({
        id: filename,
        message: typeof warn === 'string' ? warn : warn.msg,
      })
    )
  }

  if (errors) {
    errors.forEach((error) => {
      // 2.6 compiler outputs errors as objects with range
      if (
        vueTemplateCompiler.generateCodeFrame &&
        vueTemplateOptions.compilerOptions?.outputSourceRange
      ) {
        const { msg, start, end } = error as vueTemplateCompiler.ErrorWithRange
        return pluginContext.error(
          createRollupError(filename, {
            message: msg,
            frame: vueTemplateCompiler.generateCodeFrame(source, start, end),
          })
        )
      } else {
        pluginContext.error({
          id: filename,
          message: typeof error === 'string' ? error : error.msg,
        })
      }
    })
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
