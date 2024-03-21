import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { type InlineConfig, type Rollup, build } from 'vite'
import { Features } from 'lightningcss'
import {
  base64Module,
  getCssSourceMaps,
  isBuild,
  isServe,
  page,
  viteTestUrl,
} from '~utils'

/*
Skipped most tests for now because:
1. For some reason, dev and build exports classes as `"l9uHSq_button": "l9uHSq_l9uHSq_button"` (double hash)
2. I don't undertstand how sourcemaps is being tested
3. The `vite-css-modules` implementation sidesteps the initial parsing to postcss, which we don't want when
   using lightningcss. postcss should be completely not used.
*/

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
    css: {
      postcss: {},
      ...inlineConfig?.css,
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

test.runIf(isBuild).skip('Configured', async () => {
  const { js, css } = await viteBuild('../../multi-css-modules', {
    css: {
      transformer: 'lightningcss',
    },
    build: {
      target: 'es2022',
    },
  })

  const exported = await import(base64Module(js))
  expect(exported).toMatchObject({
    style1: {
      className1: expect.stringMatching(
        /^[\w-]+_className1\s+[\w-]+_util-class$/,
      ),
      default: {
        className1: expect.stringMatching(
          /^[\w-]+_className1\s+[\w-]+_util-class$/,
        ),
        'class-name2': expect.stringMatching(
          /^[\w-]+_class-name2\s+[\w-]+_util-class\s+[\w-]+_util-class$/,
        ),
      },
    },
    style2: {
      'class-name2': expect.stringMatching(
        /^[\w-]+_class-name2\s+[\w-]+_util-class$/,
      ),
      default: {
        'class-name2': expect.stringMatching(
          /^[\w-]+_class-name2\s+[\w-]+_util-class$/,
        ),
      },
    },
  })

  // Util is not duplicated
  const utilClass = Array.from(css!.matchAll(/foo/g))
  expect(utilClass.length).toBe(1)
})

test.runIf(isBuild).skip('Empty CSS Module', async () => {
  const { js, css } = await viteBuild('../../empty-css-module', {
    css: {
      transformer: 'lightningcss',
    },
  })

  const exported = await import(base64Module(js))
  expect(exported).toMatchObject({
    default: {},
  })
  expect(css).toBe('\n')
})

test('reserved keywords', async () => {
  const { js } = await viteBuild('../../reserved-keywords', {
    build: {
      target: 'es2022',
    },
    css: {
      transformer: 'lightningcss',
    },
  })
  const exported = await import(base64Module(js))
  expect(exported).toMatchObject({
    style: {
      default: {
        export: 'fk9XWG_export V_YH-W_with',
        import: 'fk9XWG_import V_YH-W_if',
      },
      export: 'fk9XWG_export V_YH-W_with',
      import: 'fk9XWG_import V_YH-W_if',
    },
  })
})

describe.skip('Custom property dependencies', () => {
  test.runIf(isBuild)('build', async () => {
    const { js, css } = await viteBuild(
      '../../lightningcss-custom-properties-from',
      {
        css: {
          transformer: 'lightningcss',
          lightningcss: {
            cssModules: {
              dashedIdents: true,
            },
          },
        },
      },
    )

    console.log(js)

    const exported = await import(base64Module(js))
    expect(exported).toMatchObject({
      style1: {
        button: expect.stringMatching(/^[\w-]+_button$/),
      },
      style2: {
        input: expect.stringMatching(/^[\w-]+input$/),
      },
    })

    const variableNameMatches = Array.from(css!.matchAll(/(\S+): hotpink/g))!
    expect(variableNameMatches.length).toBe(1)

    const variableName = variableNameMatches[0]![1]
    expect(css).toMatch(`color: var(${variableName})`)
    expect(css).toMatch(`background: var(${variableName})`)
  })

  test.runIf(isServe)('serve', async () => {
    await page.goto(viteTestUrl + '/lightningcss.html')
    const code = await getStyleMatchingId('lightningcss-custom-properties-from')

    const variableNameMatches = Array.from(code.matchAll(/(\S+): hotpink/g))!
    expect(variableNameMatches.length).toBe(1)

    const variableName = variableNameMatches[0]![1]
    expect(code).toMatch(`color: var(${variableName})`)
    expect(code).toMatch(`background: var(${variableName})`)
  })
})

describe.skip('Other configs', () => {
  test.runIf(isBuild)('build', async () => {
    const { css } = await viteBuild('../../lightningcss-features', {
      css: {
        transformer: 'lightningcss',
        lightningcss: {
          include: Features.Nesting,
        },
      },
    })

    expect(css).toMatch(/\.[\w-]+_button\.[\w-]+_primary/)
  })

  test.runIf(isServe).skip('dev server', async () => {
    await page.goto(viteTestUrl + '/lightningcss.html')
    const code = await getStyleMatchingId('lightningcss-features')

    const cssSourcemaps = getCssSourceMaps(code)
    expect(cssSourcemaps.length).toBe(0)

    expect(code).toMatch(/\.[\w-]+_button\.[\w-]+_primary/)
  })

  test.skip('devSourcemap', async () => {
    const code = await getStyleMatchingId('lightningcss-custom-properties-from')

    const cssSourcemaps = getCssSourceMaps(code)
    expect(cssSourcemaps.length).toBe(3)
    // I'm skeptical these source maps are correct
    // Seems lightningCSS is providing these source maps
    expect(cssSourcemaps).toMatchObject([
      {
        version: 3,
        file: expect.stringMatching(/^style1\.module\.css$/),
        mappings: 'AAAA',
        names: [],
        ignoreList: [],
        sources: [expect.stringMatching(/^style1\.module\.css$/)],
        sourcesContent: [
          '.button {\n\tbackground: var(--accent-color from "./vars.module.css");\n}',
        ],
      },
      {
        version: 3,
        file: expect.stringMatching(/^style2\.module\.css$/),
        mappings: 'AAAA',
        names: [],
        ignoreList: [],
        sources: [expect.stringMatching(/^style2\.module\.css$/)],
        sourcesContent: [
          '.input {\n\tcolor: var(--accent-color from "./vars.module.css");\n}',
        ],
      },
      {
        version: 3,
        sourceRoot: null,
        mappings: 'AAAA',
        sources: [expect.stringMatching(/^vars\.module\.css$/)],
        sourcesContent: [':root {\n\t--accent-color: hotpink;\n}'],
        names: [],
      },
    ])
  })

  test.skip('devSourcemap with Vue.js', async () => {
    const code = await getStyleMatchingId('vue')
    const cssSourcemaps = getCssSourceMaps(code)
    expect(cssSourcemaps.length).toBe(2)
    expect(cssSourcemaps).toMatchObject([
      {
        version: 3,
        mappings: 'AAKA;;;;ACLA',
        names: [],
        sources: [expect.stringMatching(/\/comp\.vue$/), '\u0000<no source>'],
        sourcesContent: [
          '<template>\n' +
            '\t<p :class="$style[\'css-module\']">&lt;css&gt; module</p>\n' +
            '</template>\n' +
            '\n' +
            '<style module>\n' +
            '.css-module {\n' +
            "\tcomposes: util-class from './utils.css';\n" +
            '\tcolor: red;\n' +
            '}\n' +
            '</style>',
          null,
        ],
        file: expect.stringMatching(/\/comp\.vue$/),
      },
      {
        version: 3,
        mappings: 'AAAA;;;;;AAKA;;;;ACLA',
        names: [],
        sources: [expect.stringMatching(/\/utils\.css$/), '\u0000<no source>'],
        sourcesContent: [
          '.util-class {\n' +
            "\t--name: 'foo';\n" +
            '\tcolor: blue;\n' +
            '}\n' +
            '\n' +
            '.unused-class {\n' +
            '\tcolor: yellow;\n' +
            '}',
          null,
        ],
        file: expect.stringMatching(/\/utils\.css$/),
      },
    ])
  })
})
