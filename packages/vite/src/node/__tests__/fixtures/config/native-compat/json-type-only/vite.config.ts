import type data from './data.json'
export type { default as Data } from './data.json'

const value: typeof data = { value: 1 }

export default { define: { DATA: JSON.stringify(value.value) } }
