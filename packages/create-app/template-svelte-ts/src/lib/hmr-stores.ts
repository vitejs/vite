// Use external stores to retain value even after HMR
import { writable } from 'svelte/store'
import type { Writable } from 'svelte/store'

let stores: Record<string, Writable<any>> = {}

export function getStore<T>(id: string, initialValue: T): Writable<T> {
  return stores[id] || (stores[id] = writable(initialValue))
}
