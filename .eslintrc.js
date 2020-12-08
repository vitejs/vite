module.exports = {
  root: true,
  extends: ['plugin:node/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2020
  },
  rules: {
    'node/no-missing-import': [
      'error',
      {
        tryExtensions: ['.ts', '.js']
      }
    ],
    'node/no-missing-require': [
      'error',
      {
        tryExtensions: ['.ts', '.js']
      }
    ],
    'node/no-restricted-require': [
      'error',
      Object.keys(require('./packages/vite/package.json').devDependencies).map(
        (d) => ({
          name: d,
          message:
            `devDependencies can only be imported using ESM syntax so ` +
            `that they are included in the rollup bundle. If you are trying to ` +
            `lazy load a dep, use (await import('dep')).default instead.`
        })
      )
    ],
    'node/no-deprecated-api': 'off',
    'node/no-unsupported-features/es-syntax': 'off',
    'no-process-exit': 'off'
  }
}
