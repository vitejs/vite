import { cssUrlRE } from '../../plugins/css'

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
})
