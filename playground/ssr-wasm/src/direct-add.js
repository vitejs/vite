import { add } from './add.wasm'

export async function render() {
  return `<div class="direct-add">${add(1, 2)}</div>`
}
