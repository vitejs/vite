import dep from './dep'

export const a = 'A0'

const bValue = 'B0'
export { bValue as b }

const def = 'D0'

export default def

log(`<<<<<< ${a} ${bValue} ${def} ; ${dep}`)

if (import.meta.hot) {
  import.meta.hot.acceptExports(['a', 'default'])
}
