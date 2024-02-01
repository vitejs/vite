import dep from './dep'

export const a = 'A0'

export const b = 'B0'

log(`<<< named: ${a} ; ${dep}`)

if (import.meta.hot) {
  import.meta.hot.acceptExports(['b'])
}
