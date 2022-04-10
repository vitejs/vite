import { emptyString, findEmptyStringRawIndex } from '../../node/cleanString'

// test('comments', () => {
//   expect(
//     emptyString(`
//     // comment1 // comment
//     // comment1
//     /* coment2 */
//     /*
//       // coment3
//     */
//     /* // coment3 */
//     /* // coment3 */ // comment
//     // comment 4 /* comment 5 */
//   `).trim()
//   ).toBe('')
// })

// test('strings', () => {
//   const clean = emptyString(`
//     // comment1
//     const a = 'aaaa'
//     /* coment2 */
//     const b = "bbbb"
//     /*
//       // coment3
//     */
//     /* // coment3 */
//     // comment 4 /* comment 5 */
//   `)
//   expect(clean).toMatch("const a = '\0\0\0\0'")
//   expect(clean).toMatch('const b = "\0\0\0\0"')
// })

// test('strings comment nested', () => {
//   expect(
//     emptyString(`
//     // comment 1 /* " */
//     const a = "a //"
//     // comment 2 /* " */
//   `)
//   ).toMatch('const a = "\0\0\0\0"')

//   expect(
//     emptyString(`
//     // comment 1 /* ' */
//     const a = "a //"
//     // comment 2 /* ' */
//   `)
//   ).toMatch('const a = "\0\0\0\0"')

//   expect(
//     emptyString(`
//     // comment 1 /* \` */
//     const a = "a //"
//     // comment 2 /* \` */
//   `)
//   ).toMatch('const a = "\0\0\0\0"')

//   expect(
//     emptyString(`
//     const a = "a //"
//     console.log("console")
//   `)
//   ).toMatch('const a = "\0\0\0\0"')

//   expect(
//     emptyString(`
//     const a = "a /*"
//     console.log("console")
//     const b = "b */"
//   `)
//   ).toMatch('const a = "\0\0\0\0"')

//   expect(
//     emptyString(`
//     const a = "a ' "
//     console.log("console")
//     const b = "b ' "
//   `)
//   ).toMatch('const a = "\0\0\0\0"')

//   expect(
//     emptyString(`
//     const a = "a \` "
//     console.log("console")
//     const b = "b \` "
//   `)
//   ).toMatch('const a = "\0\0\0\0"')
// })

// test('find empty string flag in raw index', () => {
//   const str = `
//     const a = "aaaaa"
//     const b = "bbbbb"
//   `
//   const clean = emptyString(str)
//   expect(clean).toMatch('const a = "\0\0\0\0\0"')
//   expect(clean).toMatch('const b = "\0\0\0\0\0"')

//   const aIndex = str.indexOf('const a = "aaaaa"')
//   const a = findEmptyStringRawIndex(clean, '\0\0\0\0\0', aIndex)
//   expect(str.slice(a[0], a[1])).toMatch('aaaaa')

//   const bIndex = str.indexOf('const b = "bbbbb"')
//   const b = findEmptyStringRawIndex(clean, '\0\0\0\0\0', bIndex)
//   expect(str.slice(b[0], b[1])).toMatch('bbbbb')
// })

// test case
// `${ ( a = {}) }`
// <img src="${new URL('../assets/images/loading/loading.gif', import.meta.url).href}" alt=''>
// `##${a + b + `##${c + `##${d}`}##`}##`

test('template string nested', () => {
  let str = 'const a = `aaaa`'
  let res = 'const a = `\0\0\0\0`'
  let clean = emptyString(str)
  expect(clean).toMatch(res)

  str = 'const a = `aa${a}aa`'
  res = 'const a = `\0\0${a}\0\0`'
  clean = emptyString(str)
  expect(clean).toMatch(res)

  str = 'const a = `aa${a + `a` + a}aa`'
  res = 'const a = `\0\0${a + `\0` + a}\0\0`'
  clean = emptyString(str)
  expect(clean).toMatch(res)

  str = 'const a = `aa${a + `aaaa${c + (a = {b: 1}) + d}` + a}aa`'
  res = 'const a = `\0\0${a + `\0\0\0\0${c + (a = {b: 1}) + d}` + a}\0\0`'
  clean = emptyString(str)
  expect(clean).toMatch(res)

  str = 'const a = `aaaa'
  res = ''
  try {
    clean = emptyString(str)
  } catch {}
  expect(clean).toMatch(res)
})
