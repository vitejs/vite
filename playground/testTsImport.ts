import { baz } from './baz.js'

export function foo(m: string) {
  console.log('you crazy' + m)
  return baz() + 'yo crazy'
}
