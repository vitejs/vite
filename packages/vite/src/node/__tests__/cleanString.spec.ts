import { assetAttrsConfig } from './../plugins/html'
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

test('escape character', () => {
  const clean = emptyString(`
    '1\\'1'
    "1\\"1"
    "1\\"1\\"1"
    "1\\'1'\\"1"
    "1'1'"
    "1'\\'1\\''\\"1\\"\\""
    '1"\\"1\\""\\"1\\"\\"'
    '""1""'
    '"""1"""'
    '""""1""""'
    "''1''"
    "'''1'''"
    "''''1''''"
  `)
  expect(clean).not.toMatch('1')
})

test('regexp affect', () => {
  const clean = emptyString(`
    /'/
    '1'
    /"/
    "1"
  `)
  expect(clean).not.toMatch('1')
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

test('template string nested', () => {
  let str = '`aaaa`'
  let res = '`\0\0\0\0`'
  let clean = emptyString(str)
  expect(clean).toMatch(res)

  str = '`aaaa` `aaaa`'
  res = '`\0\0\0\0` `\0\0\0\0`'
  clean = emptyString(str)
  expect(clean).toMatch(res)

  str = '`aa${a}aa`'
  res = '`\0\0${a}\0\0`'
  clean = emptyString(str)
  expect(clean).toMatch(res)

  str = '`aa${a + `a` + a}aa`'
  res = '`\0\0${a + `\0` + a}\0\0`'
  clean = emptyString(str)
  expect(clean).toMatch(res)

  str = '`aa${a + `a` + a}aa` `aa${a + `a` + a}aa`'
  res = '`\0\0${a + `\0` + a}\0\0` `\0\0${a + `\0` + a}\0\0`'
  clean = emptyString(str)
  expect(clean).toMatch(res)

  str = '`aa${a + `aaaa${c + (a = {b: 1}) + d}` + a}aa`'
  res = '`\0\0${a + `\0\0\0\0${c + (a = {b: 1}) + d}` + a}\0\0`'
  clean = emptyString(str)
  expect(clean).toMatch(res)

  str =
    '`aa${a + `aaaa${c + (a = {b: 1}) + d}` + a}aa` `aa${a + `aaaa${c + (a = {b: 1}) + d}` + a}aa`'
  res =
    '`\0\0${a + `\0\0\0\0${c + (a = {b: 1}) + d}` + a}\0\0` `\0\0${a + `\0\0\0\0${c + (a = {b: 1}) + d}` + a}\0\0`'
  clean = emptyString(str)
  expect(clean).toMatch(res)

  str = '`aaaa'
  res = ''
  try {
    clean = emptyString(str)
  } catch {}
  expect(clean).toMatch(res)

  str =
    "<img src=\"${new URL('../assets/images/loading/loading.gif', import.meta.url).href}\" alt=''>"
  res = `<img src="\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0" alt=''>`
  clean = emptyString(str)
  expect(clean).toMatch(res)
})
