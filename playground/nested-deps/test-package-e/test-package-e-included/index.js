import { testExcluded } from '@vitejs/test-package-e-excluded'

export function testIncluded() {
  return testExcluded()
}
