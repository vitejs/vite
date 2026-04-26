export const value = 'a'

export const loadC = () => import('./c.js')

globalThis.__vite_sri_cycle_a = loadC
