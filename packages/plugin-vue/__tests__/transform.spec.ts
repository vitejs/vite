import { transformMain } from '../src/main'

describe('main transform', () => {
  test('should compile css modules to treeshakable code', async () => {
    const sfc = `
    <style module>a { color: red }</style>
    <style module="Foo">a { color: blue }</style>
    `
    const { code } = await transformMain(
      sfc,
      'test.vue',
      {
        compiler: require('vue/compiler-sfc'),
        root: __dirname,
        sourceMap: false
      },
      {} as any,
      false,
      false
    )
    expect(code).toMatchInlineSnapshot(`
      "const _sfc_main = {}


      import style0 from \\"test.vue?vue&type=style&index=0&lang.module.css\\"
      import style1 from \\"test.vue?vue&type=style&index=1&lang.module.css\\"
      const cssModules = {
      \\"$style\\":style0,
      \\"Foo\\":style1,
      }

      import _export_sfc from 'plugin-vue:export-helper'
      export default /*#__PURE__*/_export_sfc(_sfc_main, [['__cssModules',cssModules]])"
    `)
  })
})
