import { emptyString } from '../../node/cleanString'

test('comments', () => {
  expect(
    emptyString(`
    // comment1 // comment
    // comment1
    /* coment2 */
    /*
      // coment3
    */
    /* // coment3 */
    /* // coment3 */ // comment
    // comment 4 /* comment 5 */
  `).trim()
  ).toBe('')
})

test('strings', () => {
  const clean = emptyString(`
    // comment1
    const a = 'aaaa'
    /* coment2 */
    const b = "bbbb"
    /*
      // coment3
    */
    /* // coment3 */
    // comment 4 /* comment 5 */
  `)
  expect(clean).toMatch("const a = '\0\0\0\0'")
  expect(clean).toMatch('const b = "\0\0\0\0"')
})

test('strings comment nested', () => {
  expect(
    emptyString(`
    // comment 1 /* " */
    const a = "a //"
    // comment 2 /* " */
  `)
  ).toMatch('const a = "\0\0\0\0"')

  expect(
    emptyString(`
    // comment 1 /* ' */
    const a = "a //"
    // comment 2 /* ' */
  `)
  ).toMatch('const a = "\0\0\0\0"')

  expect(
    emptyString(`
    // comment 1 /* \` */
    const a = "a //"
    // comment 2 /* \` */
  `)
  ).toMatch('const a = "\0\0\0\0"')

  expect(
    emptyString(`
    const a = "a //"
    console.log("console")
  `)
  ).toMatch('const a = "\0\0\0\0"')

  expect(
    emptyString(`
    const a = "a /*"
    console.log("console")
    const b = "b */"
  `)
  ).toMatch('const a = "\0\0\0\0"')

  expect(
    emptyString(`
    const a = "a ' "
    console.log("console")
    const b = "b ' "
  `)
  ).toMatch('const a = "\0\0\0\0"')

  expect(
    emptyString(`
    const a = "a \` "
    console.log("console")
    const b = "b \` "
  `)
  ).toMatch('const a = "\0\0\0\0"')
})

test('find empty string flag in raw index', () => {
  const str = `
    const a = "aaaaa"
    const b = "bbbbb"
  `
  const clean = emptyString(str)
  expect(clean).toMatch('const a = "\0\0\0\0\0"')
  expect(clean).toMatch('const b = "\0\0\0\0\0"')

  const aIndex = str.indexOf('const a = "aaaaa"')
  const aStart = clean.indexOf('\0\0\0\0\0', aIndex)
  expect(str.slice(aStart, aStart + 5)).toMatch('aaaaa')

  const bIndex = str.indexOf('const b = "bbbbb"')
  const bStart = clean.indexOf('\0\0\0\0\0', bIndex)
  expect(str.slice(bStart, bStart + 5)).toMatch('bbbbb')
})
