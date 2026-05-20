// Triangle vertex A. After invalidateAll the persisted importers graph still
// contains t <- v <- u <- t, so any cycle check that walks `importers` will
// classify a non-cycle consumer of t as part of a cycle.
import { y } from './u.js'
import './stall.js'
export const x = 1
export const fromU = y
