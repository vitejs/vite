import { exported_func } from './light-with-imports.wasm'
import { getResult } from './imports.js'

export async function render() {
  exported_func()
  return `<div class="direct-light">${getResult()}</div>`
}
