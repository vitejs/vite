// @ts-check
const { builtinModules } = require('node:module')
const { defineConfig } = require('eslint-define-config')

module.exports = defineConfig({
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  plugins: ['import'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2021
  },
  rules: {
    eqeqeq: ['warn', 'always', { null: 'never' }],
    'no-debugger': ['error'],
    'no-empty': ['warn', { allowEmptyCatch: true }],
    'no-process-exit': 'off',
    'no-useless-escape': 'off',
    'prefer-const': [
      'warn',
      {
        destructuring: 'all'
      }
    ],

    'node/no-missing-import': [
      'error',
      {
        allowModules: ['types', 'estree', 'less', 'sass', 'stylus'],
        tryExtensions: ['.ts', '.js', '.jsx', '.tsx', '.d.ts']
      }
    ],
    'node/no-missing-require': [
      'error',
      {
        // for try-catching yarn pnp
        allowModules: ['pnpapi', 'vite'],
        tryExtensions: ['.ts', '.js', '.jsx', '.tsx', '.d.ts']
      }
    ],
    'node/no-extraneous-import': [
      'error',
      {
        allowModules: ['vite', 'less', 'sass', 'vitest']
      }
    ],
    'node/no-extraneous-require': [
      'error',
      {
        allowModules: ['vite']
      }
    ],
    'node/no-deprecated-api': 'off',
    'node/no-unpublished-import': 'off',
    'node/no-unpublished-require': 'off',
    'node/no-unsupported-features/es-syntax': 'off',

    '@typescript-eslint/ban-ts-comment': 'off', // TODO: we should turn this on in a new PR
    '@typescript-eslint/ban-types': 'off', // TODO: we should turn this on in a new PR
    '@typescript-eslint/explicit-module-boundary-types': [
      'error',
      { allowArgumentsExplicitlyTypedAsAny: true }
    ],
    '@typescript-eslint/no-empty-function': [
      'error',
      { allow: ['arrowFunctions'] }
    ],
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/no-explicit-any': 'off', // maybe we should turn this on in a new PR
    '@typescript-eslint/no-extra-semi': 'off', // conflicts with prettier
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off', // maybe we should turn this on in a new PR
    '@typescript-eslint/no-unused-vars': 'off', // maybe we should turn this on in a new PR
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { prefer: 'type-imports' }
    ],

    'import/no-nodejs-modules': [
      'error',
      { allow: builtinModules.map((mod) => `node:${mod}`) }
    ],
    'import/no-duplicates': 'error',
    'import/order': 'error',
    'sort-imports': [
      'error',
      {
        ignoreCase: false,
        ignoreDeclarationSort: true,
        ignoreMemberSort: false,
        memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
        allowSeparatedGroups: false
      }
    ]
  },
  overrides: [
    {
      files: ['packages/**'],
      excludedFiles: '**/__tests__/**',
      rules: {
        'no-restricted-globals': ['error', 'require', '__dirname', '__filename']
      }
    },
    {
      files: 'packages/vite/**/*.*',
      rules: {
        'node/no-restricted-require': [
          'error',
          Object.keys(
            require('./packages/vite/package.json').devDependencies
          ).map((d) => ({
            name: d,
            message:
              `devDependencies can only be imported using ESM syntax so ` +
              `that they are included in the rollup bundle. If you are trying to ` +
              `lazy load a dependency, use (await import('dependency')).default instead.`
          }))
        ]
      }
    },
    {
      files: ['packages/vite/src/node/**'],
      rules: {
        'no-console': ['error']
      }
    },
    {
      files: ['packages/vite/src/types/**', '*.spec.ts'],
      rules: {
        'node/no-extraneous-import': 'off'
      }
    },
    {
      files: ['packages/create-vite/template-*/**', '**/build.config.ts'],
      rules: {
        'no-undef': 'off',
        'node/no-missing-import': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off'
      }
    },
    {
      files: ['playground/**'],
      rules: {
        'node/no-extraneous-import': 'off',
        'node/no-extraneous-require': 'off',
        'node/no-missing-import': 'off',
        'node/no-missing-require': 'off',
        // engine field doesn't exist in playgrounds
        'node/no-unsupported-features/es-builtins': [
          'error',
          {
            version: '^14.18.0 || >=16.0.0'
          }
        ],
        'node/no-unsupported-features/node-builtins': [
          'error',
          {
            version: '^14.18.0 || >=16.0.0'
          }
        ],
        '@typescript-eslint/explicit-module-boundary-types': 'off'
      }
    },
    {
      files: ['playground/**'],
      excludedFiles: '**/__tests__/**',
      rules: {
        'no-undef': 'off',
        'no-empty': 'off',
        'no-constant-condition': 'off',
        '@typescript-eslint/no-empty-function': 'off'
      }
    },
    {
      files: ['*.js', '*.mjs', '*.cjs'],
      rules: {
        '@typescript-eslint/explicit-module-boundary-types': 'off'
      }
    },
    {
      files: ['*.d.ts'],
      rules: {
        '@typescript-eslint/triple-slash-reference': 'off'
      }
    }
  ],
  reportUnusedDisableDirectives: true
})
