import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { resolveConfig } from '../../config'
import type { InlineConfig } from '../../config'
import {
  convertTargets,
  cssPlugin,
  cssUrlRE,
  getEmptyChunkReplacer,
  hoistAtRules,
  preprocessCSS,
  resolveLibCssFilename,
} from '../../plugins/css'
import { PartialEnvironment } from '../../baseEnvironment'

const __dirname = path.resolve(fileURLToPath(import.meta.url), '..')

describe('search css url function', () => {
  test('some spaces before it', () => {
    expect(
      cssUrlRE.test("list-style-image: url('../images/bullet.jpg');"),
    ).toBe(true)
  })

  test('no space after colon', () => {
    expect(cssUrlRE.test("list-style-image:url('../images/bullet.jpg');")).toBe(
      true,
    )
  })

  test('at the beginning of line', () => {
    expect(cssUrlRE.test("url('../images/bullet.jpg');")).toBe(true)
  })

  test('as suffix of a function name', () => {
    expect(
      cssUrlRE.test(`@function svg-url($string) {
      @return "";
    }`),
    ).toBe(false)
  })

  test('after parenthesis', () => {
    expect(
      cssUrlRE.test(
        'mask-image: image(url(mask.png), skyblue, linear-gradient(rgba(0, 0, 0, 1.0), transparent));',
      ),
    ).toBe(true)
  })

  test('after comma', () => {
    expect(
      cssUrlRE.test(
        'mask-image: image(skyblue,url(mask.png), linear-gradient(rgba(0, 0, 0, 1.0), transparent));',
      ),
    ).toBe(true)
  })
})

describe('css modules', () => {
  test('css module compose/from path resolutions', async () => {
    const { transform } = await createCssPluginTransform({
      configFile: false,
      resolve: {
        alias: [
          {
            find: '@',
            replacement: path.join(
              import.meta.dirname,
              './fixtures/css-module-compose',
            ),
          },
        ],
      },
    })

    const result = await transform(
      `\
.foo {
position: fixed;
composes: bar from '@/css/bar.module.css';
}`,
      '/css/foo.module.css',
    )

    expect(result.code).toMatchInlineSnapshot(
      `
      "._bar_1b4ow_1 {
        display: block;
        background: #f0f;
      }
      ._foo_86148_1 {
      position: fixed;
      }"
    `,
    )
  })

  test('custom generateScopedName', async () => {
    const { transform } = await createCssPluginTransform({
      configFile: false,
      css: {
        modules: {
          generateScopedName: 'custom__[hash:base64:5]',
        },
      },
    })
    const css = `\
.foo {
  color: red;
}`
    const result1 = await transform(css, '/foo.module.css') // server
    const result2 = await transform(css, '/foo.module.css?direct') // client
    expect(result1.code).toBe(result2.code)
  })
})

describe('hoist @ rules', () => {
  test('hoist @import', async () => {
    const css = `.foo{color:red;}@import "bla";`
    const result = await hoistAtRules(css)
    expect(result).toBe(`@import "bla";.foo{color:red;}`)
  })

  test('hoist @import url with semicolon', async () => {
    const css = `.foo{color:red;}@import url("bla;bla");`
    const result = await hoistAtRules(css)
    expect(result).toBe(`@import url("bla;bla");.foo{color:red;}`)
  })

  test('hoist @import url data with semicolon', async () => {
    const css = `.foo{color:red;}@import url(data:image/png;base64,iRxVB0);`
    const result = await hoistAtRules(css)
    expect(result).toBe(
      `@import url(data:image/png;base64,iRxVB0);.foo{color:red;}`,
    )
  })

  test('hoist @import with semicolon in quotes', async () => {
    const css = `.foo{color:red;}@import "bla;bar";`
    const result = await hoistAtRules(css)
    expect(result).toBe(`@import "bla;bar";.foo{color:red;}`)
  })

  test('hoist @charset', async () => {
    const css = `.foo{color:red;}@charset "utf-8";`
    const result = await hoistAtRules(css)
    expect(result).toBe(`@charset "utf-8";.foo{color:red;}`)
  })

  test('hoist one @charset only', async () => {
    const css = `.foo{color:red;}@charset "utf-8";@charset "utf-8";`
    const result = await hoistAtRules(css)
    expect(result).toBe(`@charset "utf-8";.foo{color:red;}`)
  })

  test('hoist @import and @charset', async () => {
    const css = `.foo{color:red;}@import "bla";@charset "utf-8";.bar{color:green;}@import "baz";`
    const result = await hoistAtRules(css)
    expect(result).toBe(
      `@charset "utf-8";@import "bla";@import "baz";.foo{color:red;}.bar{color:green;}`,
    )
  })

  test('dont hoist @import in comments', async () => {
    const css = `.foo{color:red;}/* @import "bla"; */@import "bar";`
    const result = await hoistAtRules(css)
    expect(result).toBe(`@import "bar";.foo{color:red;}/* @import "bla"; */`)
  })

  test('dont hoist @charset in comments', async () => {
    const css = `.foo{color:red;}/* @charset "utf-8"; */@charset "utf-8";`
    const result = await hoistAtRules(css)
    expect(result).toBe(
      `@charset "utf-8";.foo{color:red;}/* @charset "utf-8"; */`,
    )
  })

  test('dont hoist @import and @charset in comments', async () => {
    const css = `
.foo{color:red;}
/*
  @import "bla";
*/
@charset "utf-8";
/*
  @charset "utf-8";
  @import "bar";
*/
@import "baz";`
    const result = await hoistAtRules(css)
    expect(result).toMatchInlineSnapshot(`
      "@charset "utf-8";@import "baz";
      .foo{color:red;}
      /*
        @import "bla";
      */

      /*
        @charset "utf-8";
        @import "bar";
      */
      "
    `)
  })
})

async function createCssPluginTransform(inlineConfig: InlineConfig = {}) {
  const config = await resolveConfig(inlineConfig, 'serve')
  const environment = new PartialEnvironment('client', config)

  const { transform, buildStart } = cssPlugin(config)

  // @ts-expect-error buildStart is function
  await buildStart.call({})

  return {
    async transform(code: string, id: string) {
      // @ts-expect-error transform is function
      return await transform.call(
        {
          addWatchFile() {
            return
          },
          environment,
        },
        code,
        id,
      )
    },
  }
}

describe('convertTargets', () => {
  test('basic cases', () => {
    expect(convertTargets('es2018')).toStrictEqual({
      chrome: 4128768,
      edge: 5177344,
      firefox: 3801088,
      safari: 786432,
      opera: 3276800,
    })
    expect(convertTargets(['safari13.1', 'ios13', 'node14'])).toStrictEqual({
      ios_saf: 851968,
      safari: 852224,
    })
  })
})

describe('getEmptyChunkReplacer', () => {
  test('replaces import call', () => {
    const code = `\
import "some-module";
import "pure_css_chunk.js";
import "other-module";`

    const replacer = getEmptyChunkReplacer(['pure_css_chunk.js'], 'es')
    const replaced = replacer(code)
    expect(replaced.length).toBe(code.length)
    expect(replaced).toMatchInlineSnapshot(`
      "import "some-module";
      /* empty css             */
      import "other-module";"
    `)
  })

  test('replaces import call without new lines', () => {
    const code = `import "some-module";import "pure_css_chunk.js";import "other-module";`

    const replacer = getEmptyChunkReplacer(['pure_css_chunk.js'], 'es')
    const replaced = replacer(code)
    expect(replaced.length).toBe(code.length)
    expect(replaced).toMatchInlineSnapshot(
      `"import "some-module";/* empty css             */import "other-module";"`,
    )
  })

  test('replaces require call', () => {
    const code = `\
require("some-module");
require("pure_css_chunk.js");
require("other-module");`

    const replacer = getEmptyChunkReplacer(['pure_css_chunk.js'], 'cjs')
    const replaced = replacer(code)
    expect(replaced.length).toBe(code.length)
    expect(replaced).toMatchInlineSnapshot(`
      "require("some-module");
      ;/* empty css              */
      require("other-module");"
    `)
  })

  test('replaces require call in minified code without new lines', () => {
    const code = `require("some-module");require("pure_css_chunk.js");require("other-module");`

    const replacer = getEmptyChunkReplacer(['pure_css_chunk.js'], 'cjs')
    const replaced = replacer(code)
    expect(replaced.length).toBe(code.length)
    expect(replaced).toMatchInlineSnapshot(
      `"require("some-module");;/* empty css              */require("other-module");"`,
    )
  })

  test('replaces require call in minified code that uses comma operator', () => {
    const code =
      'require("some-module"),require("pure_css_chunk.js"),require("other-module");'

    const replacer = getEmptyChunkReplacer(['pure_css_chunk.js'], 'cjs')
    const newCode = replacer(code)
    expect(newCode.length).toBe(code.length)
    expect(newCode).toMatchInlineSnapshot(
      `"require("some-module"),/* empty css               */require("other-module");"`,
    )
    // So there should be no pure css chunk anymore
    expect(newCode).not.toContain('pure_css_chunk.js')
  })

  test('replaces require call in minified code that uses comma operator 2', () => {
    const code = 'require("pure_css_chunk.js"),console.log();'
    const replacer = getEmptyChunkReplacer(['pure_css_chunk.js'], 'cjs')
    const newCode = replacer(code)
    expect(newCode.length).toBe(code.length)
    expect(newCode).toMatchInlineSnapshot(
      `"/* empty css               */console.log();"`,
    )
    expect(newCode).not.toContain('pure_css_chunk.js')
  })

  test('replaces require call in minified code that uses comma operator followed by assignment', () => {
    const code =
      'require("some-module"),require("pure_css_chunk.js");const v=require("other-module");'

    const replacer = getEmptyChunkReplacer(['pure_css_chunk.js'], 'cjs')
    const newCode = replacer(code)
    expect(newCode.length).toBe(code.length)
    expect(newCode).toMatchInlineSnapshot(
      `"require("some-module");/* empty css               */const v=require("other-module");"`,
    )
    expect(newCode).not.toContain('pure_css_chunk.js')
  })
})

describe('preprocessCSS', () => {
  test('works', async () => {
    const resolvedConfig = await resolveConfig({ configFile: false }, 'serve')
    const result = await preprocessCSS(
      `\
.foo {
  color:red;
  background: url(./foo.png);
}`,
      'foo.css',
      resolvedConfig,
    )
    expect(result.code).toMatchInlineSnapshot(`
      ".foo {
        color:red;
        background: url(./foo.png);
      }"
    `)
  })

  test('works with lightningcss', async () => {
    const resolvedConfig = await resolveConfig(
      {
        configFile: false,
        css: { transformer: 'lightningcss' },
      },
      'serve',
    )
    const result = await preprocessCSS(
      `\
.foo {
  color: red;
  background: url(./foo.png);
}`,
      'foo.css',
      resolvedConfig,
    )
    expect(result.code).toMatchInlineSnapshot(`
      ".foo {
        color: red;
        background: url("./foo.png");
      }
      "
    `)
  })
})

describe('resolveLibCssFilename', () => {
  test('use name from package.json', () => {
    const filename = resolveLibCssFilename(
      {
        entry: 'mylib.js',
      },
      path.resolve(__dirname, '../packages/name'),
    )
    expect(filename).toBe('mylib.css')
  })

  test('set cssFileName', () => {
    const filename = resolveLibCssFilename(
      {
        entry: 'mylib.js',
        cssFileName: 'style',
      },
      path.resolve(__dirname, '../packages/noname'),
    )
    expect(filename).toBe('style.css')
  })

  test('use fileName if set', () => {
    const filename = resolveLibCssFilename(
      {
        entry: 'mylib.js',
        fileName: 'custom-name',
      },
      path.resolve(__dirname, '../packages/name'),
    )
    expect(filename).toBe('custom-name.css')
  })

  test('use fileName if set and has array entry', () => {
    const filename = resolveLibCssFilename(
      {
        entry: ['mylib.js', 'mylib2.js'],
        fileName: 'custom-name',
      },
      path.resolve(__dirname, '../packages/name'),
    )
    expect(filename).toBe('custom-name.css')
  })
})
