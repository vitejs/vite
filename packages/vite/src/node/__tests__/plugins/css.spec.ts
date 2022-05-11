import fs from 'fs'
import path from 'path'
import { describe, expect, test, vi } from 'vitest'
import { resolveConfig } from '../../config'
import { cssPlugin, cssUrlRE, hoistAtRules } from '../../plugins/css'

describe('search css url function', () => {
  test('some spaces before it', () => {
    expect(
      cssUrlRE.test("list-style-image: url('../images/bullet.jpg');")
    ).toBe(true)
  })

  test('no space after colon', () => {
    expect(cssUrlRE.test("list-style-image:url('../images/bullet.jpg');")).toBe(
      true
    )
  })

  test('at the beginning of line', () => {
    expect(cssUrlRE.test("url('../images/bullet.jpg');")).toBe(true)
  })

  test('as suffix of a function name', () => {
    expect(
      cssUrlRE.test(`@function svg-url($string) {
      @return "";
    }`)
    ).toBe(false)
  })

  test('after parenthesis', () => {
    expect(
      cssUrlRE.test(
        'mask-image: image(url(mask.png), skyblue, linear-gradient(rgba(0, 0, 0, 1.0), transparent));'
      )
    ).toBe(true)
  })

  test('after comma', () => {
    expect(
      cssUrlRE.test(
        'mask-image: image(skyblue,url(mask.png), linear-gradient(rgba(0, 0, 0, 1.0), transparent));'
      )
    ).toBe(true)
  })
})

describe('css path resolutions', () => {
  const mockedProjectPath = path.join(process.cwd(), '/foo/bar/project')
  const mockedBarCssRelativePath = '/css/bar.module.css'
  const mockedFooCssRelativePath = '/css/foo.module.css'

  test('cssmodule compose/from path resolutions', async () => {
    const config = await resolveConfig(
      {
        resolve: {
          alias: [
            {
              find: '@',
              replacement: mockedProjectPath
            }
          ]
        }
      },
      'serve'
    )

    const { transform, buildStart } = cssPlugin(config)

    await buildStart.call({})

    const mockFs = vi
      .spyOn(fs, 'readFile')
      // @ts-ignore vi.spyOn not recognize override `fs.readFile` definition.
      .mockImplementationOnce((p, encoding, callback) => {
        expect(p).toBe(path.join(mockedProjectPath, mockedBarCssRelativePath))
        expect(encoding).toBe('utf-8')
        callback(
          null,
          Buffer.from(`
.bar {
  display: block;
  background: #f0f;
}
      `)
        )
      })

    const { code } = await transform.call(
      {
        addWatchFile() {
          return
        }
      },
      `
.foo {
  position: fixed;
  composes: bar from '@${mockedBarCssRelativePath}';
}
    `,
      path.join(mockedProjectPath, mockedFooCssRelativePath)
    )

    expect(code).toBe(`
._bar_soicv_2 {
  display: block;
  background: #f0f;
}
._foo_sctn3_2 {
  position: fixed;
}
    `)

    mockFs.mockReset()
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
      `@import url(data:image/png;base64,iRxVB0);.foo{color:red;}`
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
      `@charset "utf-8";@import "bla";@import "baz";.foo{color:red;}.bar{color:green;}`
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
      `@charset "utf-8";.foo{color:red;}/* @charset "utf-8"; */`
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
      "@charset \\"utf-8\\";@import \\"baz\\";
      .foo{color:red;}
      /*
        @import \\"bla\\";
      */

      /*
        @charset \\"utf-8\\";
        @import \\"bar\\";
      */
      "
    `)
  })
})
