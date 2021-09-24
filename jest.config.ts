// eslint-disable-next-line node/no-extraneous-import
import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testMatch: process.env.VITE_TEST_BUILD
    ? ['**/playground/**/*.spec.[jt]s?(x)']
    : ['**/*.spec.[jt]s?(x)'],
  testTimeout: process.env.CI ? 30000 : 10000,
  globalSetup: './scripts/jestGlobalSetup.js',
  globalTeardown: './scripts/jestGlobalTeardown.js',
  testEnvironment: './scripts/jestEnv.js',
  setupFilesAfterEnv: ['./scripts/jestPerTestSetup.ts'],
  watchPathIgnorePatterns: ['<rootDir>/packages/temp'],
  modulePathIgnorePatterns: ['<rootDir>/packages/temp'],
  moduleNameMapper: {
    testUtils: '<rootDir>/packages/playground/testUtils.ts'
  },
  globals: {
    'ts-jest': {
      tsconfig: './packages/playground/tsconfig.json'
    }
  }
}

export default config
