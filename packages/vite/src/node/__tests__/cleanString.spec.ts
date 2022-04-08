import { emptyString, findEmptyStringRawIndex } from '../../node/cleanString'

test('comments', () => {
  const str = `
    // comment1
    /* coment2 */
    /*
      // coment3
    */
    /* // coment3 */
    // comment 4 /* comment 5 */
  `
  const clean = emptyString(str)
  expect(clean.clean.trim()).toBe('')
})

test('strings', () => {
  const str = `
    // comment1
    const a = "aaaa"
    /* coment2 */
    const b = "bbbb"
    /*
      // coment3
    */
    /* // coment3 */
    // comment 4 /* comment 5 */
  `
  const clean = emptyString(str)
  expect(clean.clean).toMatch('const a = "\0\0\0\0"')
  expect(clean.clean).toMatch('const b = "\0\0\0\0"')
})

test('strings comment nested', () => {
  const commentNestedString = `
    // comment 1 "
    const a = "a //"
    // comment 2 "
  `
  const commentNestedStringClean = emptyString(commentNestedString)
  expect(commentNestedStringClean.clean).toMatch('const a = "\0\0\0\0"')

  const stringNestedComment = `
    const a = "a //"
    console.log("console")
  `
  const stringNestedCommentClean = emptyString(stringNestedComment)

  expect(stringNestedCommentClean.clean).toMatch('const a = "\0\0\0\0"')
})

test('empty string flag', () => {
  const str = `
    const a = "aaaaa"
    const b = "bbbbb"
  `
  const clean = emptyString(str)
  expect(clean.clean).toMatch('const a = "\0\0\0\0\0"')
  expect(clean.clean).toMatch('const b = "\0\0\0\0\0"')

  const aIndex = str.indexOf('const a = "aaaaa"')
  const a = findEmptyStringRawIndex(clean, '\0\0\0\0\0', aIndex)
  expect(str.slice(a[0], a[1])).toMatch('aaaaa')

  const bIndex = str.indexOf('const b = "bbbbb"')
  const b = findEmptyStringRawIndex(clean, '\0\0\0\0\0', bIndex)
  expect(str.slice(b[0], b[1])).toMatch('bbbbb')
})

// TODO
// describe('template string nested', () => {
//   const str = "`##${ a + b + `##${c + `##${d}`}##`}##`"
//   const clean = emptyString(str)
//   expect(clean.clean).toMatch('\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0')
// })
