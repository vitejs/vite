import { cssUrlRE, cssPlugin } from '../../plugins/css'
import { resolveConfig } from '../../config'
import fs from 'fs'
import path from 'path'
import { normalizePath } from '../../utils'

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

    const mockFs = jest
      .spyOn(fs, 'readFile')
      // @ts-ignore jest.spyOn not recognize overrided `fs.readFile` definition.
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

describe('css source maps', () => {
  const root = normalizePath(process.cwd())
  const testcases = [
    {
      name: 'cssmodule',
      code: `
    .foo {
      color: red;
    }
  `,
      id: `${root}/foo.module.css`,
      expectedMap: {
        file: `${root}/foo.module.css`,
        mappings: ';IACI;MACE,UAAU;IACZ',
        names: [],
        sources: [`${root}/foo.module.css`],
        version: 3
      }
    },
    {
      name: 'sass',
      code: `
    .foo
      color: red
  `,
      id: `${root}/foo.sass`,
      expectedMap: {
        file: `${root}/foo.sass`,
        mappings: 'AACI;EACE',
        names: [],
        sources: [`${root}/foo.sass`],
        version: 3
      }
    },
    {
      name: 'scss',
      code: `
      .foo {
        color: red;
      }
  `,
      id: `${root}/foo.scss`,
      expectedMap: {
        file: `${root}/foo.scss`,
        mappings: 'AACM;EACE',
        names: [],
        sources: [`${root}/foo.scss`],
        version: 3
      }
    },
    {
      name: 'scss module',
      code: `
      .foo {
        color: red;
      }
  `,
      id: `${root}/foo.module.scss`,
      expectedMap: {
        file: `${root}/foo.module.scss`,
        mappings: 'AACM;EACE',
        names: [],
        sources: [`${root}/foo.module.scss`],
        version: 3
      }
    }
  ]

  test.concurrent.each(testcases)(
    '$name',
    async ({ code, id, expectedMap }) => {
      const config = await resolveConfig(
        {
          root
        },
        'serve'
      )
      const { transform, buildStart } = cssPlugin(config)

      await buildStart.call({})

      const { map } = await transform.call(
        {
          addWatchFile() {
            return
          }
        },
        code,
        id
      )

      expect(map).toMatchObject(expectedMap)
    }
  )
})
