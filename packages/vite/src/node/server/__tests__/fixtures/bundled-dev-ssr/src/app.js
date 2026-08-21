import { msg } from './dep.js'
import './hot.js'

export async function render() {
  const lazy = await import('./lazy.js')
  return `${msg}|${lazy.value}`
}
