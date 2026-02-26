/**
 * Type test to verify ModuleRunnerImportMeta is structurally compatible
 * with ImportMeta (including @types/node augmentations).
 *
 * This replaces `extends ImportMeta` in the interface declaration with a
 * test-only assignability check that won't cause TS2717 "subsequent property
 * declarations must have the same type" errors in consumer projects using
 * skipLibCheck: false with augmented ImportMeta.
 */

import type { ExpectExtends, ExpectTrue } from '@type-challenges/utils'
import type { ModuleRunnerImportMeta } from '../types'

export type cases = [
  // Ensure ModuleRunnerImportMeta is assignable to ImportMeta
  // (which includes @types/node augmentations: dirname, filename, url, resolve, main)
  ExpectTrue<ExpectExtends<ImportMeta, ModuleRunnerImportMeta>>,
]

export {}
