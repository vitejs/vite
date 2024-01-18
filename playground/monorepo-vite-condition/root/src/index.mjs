import { DEFAULT_IMPORT } from '@vitejs/test-monorepo-vite-condition-exports'
import { DEEP_IMPORT } from '@vitejs/test-monorepo-vite-condition-exports/dir/deep'
import { DEFAULT_IMPORT as EXTERNAL } from '@vitejs/test-monorepo-vite-condition-exports-external'
import { DEFAULT_IMPORT as INTERNAL } from '@vitejs/test-monorepo-vite-condition-exports-internal'
import { MAIN_FIELD } from '@vitejs/test-monorepo-vite-condition-main'
import { MAIN_FIELD as MAIN_EXTERNAL } from '@vitejs/test-monorepo-vite-condition-main-external'
import { MAIN_FIELD as MAIN_INTERNAL } from '@vitejs/test-monorepo-vite-condition-main-internal'

export const exports = {
  default: DEFAULT_IMPORT,
  deep: DEEP_IMPORT,
  external: EXTERNAL,
  internal: INTERNAL,
}

export const main = {
  default: MAIN_FIELD,
  external: MAIN_EXTERNAL,
  internal: MAIN_INTERNAL,
}
