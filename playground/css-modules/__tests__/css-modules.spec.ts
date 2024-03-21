import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { type InlineConfig, type Rollup, build } from 'vite'
import { base64Module, isBuild, isServe, page } from '~utils'

async function getStyleMatchingId(id: string) {
  const styleTags = page.locator(`style[data-vite-dev-id*=${id}]`)
  let code = ''
  for (const style of await styleTags.all()) {
    code += await style.textContent()
  }
  return code
}

async function viteBuild(root: string, inlineConfig?: InlineConfig) {
  const built = await build({
    root: path.resolve(__dirname, root),
    configFile: false,
    envFile: false,
    logLevel: 'error',
    ...inlineConfig,
    build: {
      // Prevents CSS minification from handling the de-duplication of classes
      minify: false,
      write: false,
      lib: {
        entry: 'index.js',
        formats: ['es'],
      },
      ...inlineConfig?.build,
    },
  })

  if (!Array.isArray(built)) {
    throw new TypeError('Build result is not an array')
  }

  const { output } = built[0]!
  const css = output.find(
    (file) => file.type === 'asset' && file.fileName.endsWith('.css'),
  ) as Rollup.OutputAsset | undefined

  return {
    js: output[0].code,
    css: css?.source.toString(),
  }
}

test.runIf(isBuild)('Multi CSS modules', async () => {
  const { js, css } = await viteBuild('../multi-css-modules', {
    build: {
      target: 'es2022',
    },
    css: {
      modules: {
        generateScopedName: 'asdf_[local]',
      },
    },
  })

  const exported = await import(base64Module(js))
  expect(exported).toMatchObject({
    style1: {
      className1: expect.stringMatching(/^asdf_className1\s+asdf_util-class$/),
    },
    style2: {
      'class-name2': expect.stringMatching(
        /^asdf_class-name2\s+asdf_util-class$/,
      ),
    },
  })

  expect(css).toMatch('--file: "style1.module.css"')
  expect(css).toMatch('--file: "style2.module.css"')

  // Ensure that PostCSS is applied to the composed files
  expect(css).toMatch('--file: "utils1.css?.module.css"')
  expect(css).toMatch('--file: "utils2.css?.module.css"')

  // Util is not duplicated
  const utilClass = Array.from(css!.matchAll(/foo/g))
  expect(utilClass.length).toBe(1)
})

describe.runIf(isBuild)('localsConvention', () => {
  test('camelCase', async () => {
    const { js } = await viteBuild('../multi-css-modules', {
      build: {
        target: 'es2022',
      },
      css: {
        modules: {
          localsConvention: 'camelCase',
        },
      },
    })

    const exported = await import(base64Module(js))
    expect(exported).toMatchObject({
      style1: {
        'class-name2': expect.stringMatching(
          /_class-name2_\w+ _util-class_\w+ _util-class_\w+/,
        ),
        className1: expect.stringMatching(/_className1_\w+ _util-class_\w+/),
        className2: expect.stringMatching(
          /_class-name2_\w+ _util-class_\w+ _util-class_\w+/,
        ),
        default: {
          className1: expect.stringMatching(/_className1_\w+ _util-class_\w+/),
          'class-name2': expect.stringMatching(
            /_class-name2_\w+ _util-class_\w+ _util-class_\w+/,
          ),
          className2: expect.stringMatching(
            /_class-name2_\w+ _util-class_\w+ _util-class_\w+/,
          ),
        },
      },
      style2: {
        'class-name2': expect.stringMatching(
          /_class-name2_\w+ _util-class_\w+/,
        ),
        className2: expect.stringMatching(/_class-name2_\w+ _util-class_\w+/),
        default: {
          'class-name2': expect.stringMatching(
            /_class-name2_\w+ _util-class_\w+/,
          ),
          className2: expect.stringMatching(/_class-name2_\w+ _util-class_\w+/),
        },
      },
    })
  })

  test('camelCaseOnly', async () => {
    const { js } = await viteBuild('../multi-css-modules', {
      css: {
        modules: {
          localsConvention: 'camelCaseOnly',
        },
      },
    })

    const exported = await import(base64Module(js))
    expect(exported).toMatchObject({
      style1: {
        className1: expect.stringMatching(/_className1_\w+ _util-class_\w+/),
        className2: expect.stringMatching(
          /_class-name2_\w+ _util-class_\w+ _util-class_\w+/,
        ),
        default: {
          className1: expect.stringMatching(/_className1_\w+ _util-class_\w+/),
          className2: expect.stringMatching(
            /_class-name2_\w+ _util-class_\w+ _util-class_\w+/,
          ),
        },
      },
      style2: {
        className2: expect.stringMatching(/_class-name2_\w+ _util-class_\w+/),
        default: {
          className2: expect.stringMatching(/_class-name2_\w+ _util-class_\w+/),
        },
      },
    })
  })

  test('dashes', async () => {
    const { js } = await viteBuild('../multi-css-modules', {
      build: {
        target: 'es2022',
      },
      css: {
        modules: {
          localsConvention: 'dashes',
        },
      },
    })

    const exported = await import(base64Module(js))
    expect(exported).toMatchObject({
      style1: {
        'class-name2': expect.stringMatching(
          /_class-name2_\w+ _util-class_\w+ _util-class_\w+/,
        ),
        className1: expect.stringMatching(/_className1_\w+ _util-class_\w+/),
        className2: expect.stringMatching(
          /_class-name2_\w+ _util-class_\w+ _util-class_\w+/,
        ),
        default: {
          className1: expect.stringMatching(/_className1_\w+ _util-class_\w+/),
          'class-name2': expect.stringMatching(
            /_class-name2_\w+ _util-class_\w+ _util-class_\w+/,
          ),
          className2: expect.stringMatching(
            /_class-name2_\w+ _util-class_\w+ _util-class_\w+/,
          ),
        },
      },
      style2: {
        'class-name2': expect.stringMatching(
          /_class-name2_\w+ _util-class_\w+/,
        ),
        className2: expect.stringMatching(/_class-name2_\w+ _util-class_\w+/),
        default: {
          'class-name2': expect.stringMatching(
            /_class-name2_\w+ _util-class_\w+/,
          ),
          className2: expect.stringMatching(/_class-name2_\w+ _util-class_\w+/),
        },
      },
    })
  })

  test('dashesOnly', async () => {
    const { js } = await viteBuild('../multi-css-modules', {
      css: {
        modules: {
          localsConvention: 'dashesOnly',
        },
      },
    })

    const exported = await import(base64Module(js))
    expect(exported).toMatchObject({
      style1: {
        className1: expect.stringMatching(/_className1_\w+ _util-class_\w+/),
        className2: expect.stringMatching(
          /_class-name2_\w+ _util-class_\w+ _util-class_\w+/,
        ),
        default: {
          className1: expect.stringMatching(/_className1_\w+ _util-class_\w+/),
          className2: expect.stringMatching(
            /_class-name2_\w+ _util-class_\w+ _util-class_\w+/,
          ),
        },
      },
      style2: {
        className2: expect.stringMatching(/_class-name2_\w+ _util-class_\w+/),
        default: {
          className2: expect.stringMatching(/_class-name2_\w+ _util-class_\w+/),
        },
      },
    })
  })

  test('function', async () => {
    const { js } = await viteBuild('../multi-css-modules', {
      build: {
        target: 'es2022',
      },
      css: {
        modules: {
          localsConvention: (originalClassname) => `${originalClassname}123`,
        },
      },
    })

    const exported = await import(base64Module(js))
    expect(exported).toMatchObject({
      style1: {
        className1123: expect.stringMatching(/_className1_\w+ _util-class_\w+/),
        'class-name2123': expect.stringMatching(
          /_class-name2_\w+ _util-class_\w+ _util-class_\w+/,
        ),
        default: {
          className1123: expect.stringMatching(
            /_className1_\w+ _util-class_\w+/,
          ),
          'class-name2123': expect.stringMatching(
            /_class-name2_\w+ _util-class_\w+ _util-class_\w+/,
          ),
        },
      },
      style2: {
        'class-name2123': expect.stringMatching(
          /_class-name2_\w+ _util-class_\w+/,
        ),
        default: {
          'class-name2123': expect.stringMatching(
            /_class-name2_\w+ _util-class_\w+/,
          ),
        },
      },
    })
  })
})

test.runIf(isBuild)('globalModulePaths', async () => {
  const { js, css } = await viteBuild('../global-module', {
    css: {
      modules: {
        globalModulePaths: [/global\.module\.css/],
      },
    },
  })

  const exported = await import(base64Module(js))
  expect(exported).toMatchObject({
    default: {
      title: expect.stringMatching(/^_title_\w{5}/),
    },
    title: expect.stringMatching(/^_title_\w{5}/),
  })

  expect(css).toMatch('.page {')
})

test.runIf(isBuild)('inline', async () => {
  const { js } = await viteBuild('../inline-query')
  const exported = await import(base64Module(js))

  expect(typeof exported.default).toBe('string')
  expect(exported.default).toMatch('--file: "style.module.css?inline"')
})

test.runIf(isBuild)('getJSON', async () => {
  type JSON = {
    inputFile: string
    exports: Record<string, string>
    outputFile: string
  }
  const jsons: JSON[] = []

  await viteBuild('../multi-css-modules', {
    css: {
      modules: {
        localsConvention: 'camelCaseOnly',
        getJSON: (inputFile, exports, outputFile) => {
          jsons.push({
            inputFile,
            exports,
            outputFile,
          })
        },
      },
    },
  })

  // This plugin treats each CSS Module as a JS module so it emits on each module
  // rather than the final "bundle" which postcss-module emits on
  expect(jsons).toHaveLength(4)
  jsons.sort((a, b) => a.inputFile.localeCompare(b.inputFile))

  const [style1, style2, utils1, utils2] = jsons
  expect(style1).toMatchObject({
    inputFile: expect.stringMatching(/style1\.module\.css$/),
    exports: {
      className1: expect.stringMatching(/_className1_\w+ _util-class_\w+/),
      className2: expect.stringMatching(
        /_class-name2_\w+ _util-class_\w+ _util-class_\w+/,
      ),
    },
    outputFile: expect.stringMatching(/style1\.module\.css$/),
  })

  expect(style2).toMatchObject({
    inputFile: expect.stringMatching(/style2\.module\.css$/),
    exports: {
      className2: expect.stringMatching(/_class-name2_\w+ _util-class_\w+/),
    },
    outputFile: expect.stringMatching(/style2\.module\.css$/),
  })

  expect(utils1).toMatchObject({
    inputFile: expect.stringMatching(/utils1\.css\?\.module\.css$/),
    exports: {
      unusedClass: expect.stringMatching(/_unused-class_\w+/),
      utilClass: expect.stringMatching(/_util-class_\w+/),
    },
    outputFile: expect.stringMatching(/utils1\.css\?\.module\.css$/),
  })

  expect(utils2).toMatchObject({
    inputFile: expect.stringMatching(/utils2\.css\?\.module\.css$/),
    exports: {
      utilClass: expect.stringMatching(/_util-class_\w+/),
    },
    outputFile: expect.stringMatching(/utils2\.css\?\.module\.css$/),
  })
})

test.runIf(isBuild)('Empty CSS Module', async () => {
  const { js, css } = await viteBuild('../empty-css-module', {
    css: {
      postcss: {},
    },
  })

  const exported = await import(base64Module(js))
  expect(exported).toMatchObject({
    default: {},
  })
  expect(css).toBeUndefined()
})

describe('@value', () => {
  test.runIf(isBuild)('build', async () => {
    const { js, css } = await viteBuild('../css-modules-value', {
      build: {
        target: 'es2022',
      },
    })

    const exported = await import(base64Module(js))
    expect(exported).toMatchObject({
      default: {
        'class-name1': expect.stringMatching(
          /^_class-name1_\w+ _util-class_\w+ _util-class_\w+$/,
        ),
        'class-name2': expect.stringMatching(/^_class-name2_\w+$/),
      },
      'class-name1': expect.stringMatching(
        /_class-name1_\w+ _util-class_\w+ _util-class_\w+/,
      ),
      'class-name2': expect.stringMatching(/^_class-name2_\w+$/),
    })

    expect(css).toMatch('color: #fff')
    expect(css).toMatch('border: #fff')
    expect(css).toMatch('color: #000')
    expect(css).toMatch('border: #000')
    expect(css).toMatch('border: 1px solid black')

    // Ensure that PostCSS is applied to the composed files
    expect(css).toMatch('--file: "style.module.css"')
    expect(css).toMatch('--file: "utils1.css?.module.css"')
    expect(css).toMatch('--file: "utils2.css?.module.css"')
  })

  test.runIf(isServe)('dev server', async () => {
    const code = await getStyleMatchingId('css-modules-value')

    expect(code).toMatch('color: #fff')
    expect(code).toMatch('border: #fff')
    expect(code).toMatch('color: #000')
    expect(code).toMatch('border: #000')
    expect(code).toMatch('border: 1px solid black')

    // Ensure that PostCSS is applied to the composed files
    expect(code).toMatch('--file: "style.module.css"')
    expect(code).toMatch('--file: "utils1.css?.module.css"')
    expect(code).toMatch('--file: "utils2.css?.module.css"')
  })
})

describe.runIf(isBuild)('error handling', () => {
  test('missing class export', async () => {
    await expect(() =>
      viteBuild('../missing-class-export', {
        logLevel: 'silent',
      }),
    ).rejects.toThrow(
      '[vite:css-modules] Cannot resolve "non-existent" from "./utils.css"',
    )
  })

  test('exporting a non-safe class name via esm doesnt throw', async () => {
    await viteBuild('../module-namespace')
  })
})
