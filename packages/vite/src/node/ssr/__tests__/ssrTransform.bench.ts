import { bench } from 'vitest'
import { ssrTransform } from '../ssrTransform'

const ssrTransformSimple = async (code: string, url = '') =>
  ssrTransform(code, null, url, code)
const ssrTransformSimpleCode = async (code: string, url?: string) =>
  (await ssrTransformSimple(code, url))?.code

bench('basic', async () => {
  await ssrTransformSimpleCode(`
import { f } from './f'

let x = 0;

x
f()

if (1)
  x
f()

if (1)
  x
else
  x
f()


let y = x
f()

x /*;;*/ /*;;*/
f()

function z() {
  x
  f()

  if (1) {
    x
    f()
  }
}

let a = {}
f()

let b = () => {}
f()

function c() {
}
f()

class D {
}
f()

{
  x
}
f()
`)
})
