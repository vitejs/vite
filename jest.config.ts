// eslint-disable-next-line node/no-extraneous-import
import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testMatch: ['**/playground/**/*.spec.[jt]s?(x)'],
  testTimeout: process.env.CI ? 50000 : 20000,
  globalSetup: './scripts/jestGlobalSetup.cjs',
  globalTeardown: './scripts/jestGlobalTeardown.cjs',
  testEnvironment: './scripts/jestEnv.cjs',
  setupFilesAfterEnv: ['./scripts/jestPerTestSetup.ts'],
  watchPathIgnorePatterns: ['<rootDir>/playground-temp'],
  modulePathIgnorePatterns: ['<rootDir>/playground-temp'],
  moduleNameMapper: {
    testUtils: '<rootDir>/playground/testUtils.ts'
  },
  globals: {
    'ts-jest': {
      tsconfig: './playground/tsconfig.json'
    }
  }
}

export default config
