import { dep } from './dep.js'

export function getDep() {
  return dep
}

export function customImport(id) {
  return import(/* @vite-ignore */ id)
}
