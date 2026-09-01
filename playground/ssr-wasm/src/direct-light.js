import { getResult } from './imports.js'
import { exported_func } from './light-with-imports.wasm'

export async function render() {
  exported_func()
  return `<div class="direct-light">${getResult()}</div>`
}
