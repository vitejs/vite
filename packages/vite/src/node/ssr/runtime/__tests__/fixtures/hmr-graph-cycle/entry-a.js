// Fresh consumer #1. Not part of the t -> u -> v -> t triangle. Reads x
// from t at top level, which is the shape that crashed in the wild
// (shadcn-svelte destructuring a bits-ui barrel under SSR HMR).
import { x } from './t.js'
export const seen = x
