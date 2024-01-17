import { DEFAULT_IMPORT } from '@vitejs/test-monorepo-vite-condition-exports'
import { DEEP_IMPORT } from '@vitejs/test-monorepo-vite-condition-exports/dir/deep'
import { MAIN_FIELD } from '@vitejs/test-monorepo-vite-condition-main';

export const exports = { default: DEFAULT_IMPORT, deep: DEEP_IMPORT };
export const main = MAIN_FIELD;
