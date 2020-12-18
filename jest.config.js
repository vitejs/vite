module.exports = {
  preset: 'ts-jest',
  testMatch: ['**/*.spec.[jt]s?(x)'],
  globalSetup: './test/__env__/globalSetup.js',
  globalTeardown: './test/__env__/globalTeardown.js',
  testEnvironment: './test/__env__/playwrightEnv.js'
}
