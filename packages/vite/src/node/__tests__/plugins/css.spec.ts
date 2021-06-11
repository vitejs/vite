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
