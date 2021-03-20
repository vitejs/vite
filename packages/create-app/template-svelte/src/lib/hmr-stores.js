// Use external stores to retain value even after HMR
import { writable } from 'svelte/store'

/**
 * @type { Record<string, import('svelte/store').Writable<any>> }
 */
let stores = {}

/**
 * @template T
 * @param { string } id
 * @param { T } initialValue
 * @returns { import('svelte/store').Writable<T> }
 */
export function getStore(id, initialValue) {
  return stores[id] || (stores[id] = writable(initialValue))
}
