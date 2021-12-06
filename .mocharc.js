module.exports = {
  timeout: process.env.CI ? 30000 : 10000,
  extension: ['js', 'ts', 'jsx', 'tsx'],
  spec: process.env.VITE_TEST_BUILD
    ? ['**/playground/**/*.spec.[jt]s?(x)']
    : ['**/*.spec.[jt]s?(x)'],
  sort: true,
  require: ['jiti/register', './scripts/mochaSetup.js']
}
