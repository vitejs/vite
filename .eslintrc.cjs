// @ts-check
const { builtinModules } = require('node:module')
const { defineConfig } = require('eslint-define-config')
const pkg = require('./package.json')

/// <reference types="@eslint-types/typescript-eslint" />

module.exports = defineConfig({
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:n/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/stylistic',
    'plugin:regexp/recommended',
  ],
  ignorePatterns: ['packages/create-vite/template-**'],
  plugins: ['i', 'regexp'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2022,
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
        destructuring: 'all',
      },
    ],

    'n/no-process-exit': 'off',
    'n/no-missing-import': 'off',
    'n/no-missing-require': [
      'error',
      {
        // for try-catching yarn pnp
        allowModules: ['pnpapi', 'vite'],
        tryExtensions: ['.ts', '.js', '.jsx', '.tsx', '.d.ts'],
      },
    ],
    'n/no-extraneous-import': [
      'error',
      {
        allowModules: ['vite', 'less', 'sass', 'vitest', 'unbuild'],
      },
    ],
    'n/no-extraneous-require': [
      'error',
      {
        allowModules: ['vite'],
      },
    ],
    'n/no-deprecated-api': 'off',
    'n/no-unpublished-import': 'off',
    'n/no-unpublished-require': 'off',
    'n/no-unsupported-features/es-syntax': 'off',

    '@typescript-eslint/ban-ts-comment': 'error',
    '@typescript-eslint/ban-types': 'off', // TODO: we should turn this on in a new PR
    '@typescript-eslint/explicit-module-boundary-types': [
      'error',
      { allowArgumentsExplicitlyTypedAsAny: true },
    ],
    '@typescript-eslint/no-empty-function': [
      'error',
      { allow: ['arrowFunctions'] },
    ],
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/no-explicit-any': 'off', // maybe we should turn this on in a new PR
    'no-extra-semi': 'off',
    '@typescript-eslint/no-extra-semi': 'off', // conflicts with prettier
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-unused-vars': 'off', // maybe we should turn this on in a new PR
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { prefer: 'type-imports', disallowTypeAnnotations: false },
    ],
    // disable rules set in @typescript-eslint/stylistic v6 that wasn't set in @typescript-eslint/recommended v5 and which conflict with current code
    // maybe we should turn them on in a new PR
    '@typescript-eslint/array-type': 'off',
    '@typescript-eslint/ban-tslint-comment': 'off',
    '@typescript-eslint/consistent-generic-constructors': 'off',
    '@typescript-eslint/consistent-indexed-object-style': 'off',
    '@typescript-eslint/consistent-type-definitions': 'off',
    '@typescript-eslint/prefer-for-of': 'off',
    '@typescript-eslint/prefer-function-type': 'off',

    'i/no-nodejs-modules': [
      'error',
      { allow: builtinModules.map((mod) => `node:${mod}`) },
    ],
    'i/no-duplicates': 'error',
    'i/order': 'error',
    'sort-imports': [
      'error',
      {
        ignoreCase: false,
        ignoreDeclarationSort: true,
        ignoreMemberSort: false,
        memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
        allowSeparatedGroups: false,
      },
    ],

    'regexp/no-contradiction-with-assertion': 'error',
    // in some cases using explicit letter-casing is more performant than the `i` flag
    'regexp/use-ignore-case': 'off',
  },
  overrides: [
    {
      files: ['packages/**'],
      excludedFiles: '**/__tests__/**',
      rules: {
        'no-restricted-globals': [
          'error',
          'require',
          '__dirname',
          '__filename',
        ],
      },
    },
    {
      files: 'packages/vite/**/*.*',
      rules: {
        'n/no-restricted-require': [
          'error',
          Object.keys(
            require('./packages/vite/package.json').devDependencies,
          ).map((d) => ({
            name: d,
            message:
              `devDependencies can only be imported using ESM syntax so ` +
              `that they are included in the rollup bundle. If you are trying to ` +
              `lazy load a dependency, use (await import('dependency')).default instead.`,
          })),
        ],
      },
    },
    {
      files: ['packages/vite/src/node/**'],
      excludedFiles: '**/__tests__/**',
      rules: {
        'no-console': ['error'],
      },
    },
    {
      files: [
        'packages/vite/src/types/**',
        'packages/vite/scripts/**',
        '*.spec.ts',
      ],
      rules: {
        'n/no-extraneous-import': 'off',
      },
    },
    {
      files: ['packages/create-vite/template-*/**', '**/build.config.ts'],
      rules: {
        'no-undef': 'off',
        'n/no-missing-import': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
      },
    },
    {
      files: ['playground/**'],
      rules: {
        'n/no-extraneous-import': 'off',
        'n/no-extraneous-require': 'off',
        'n/no-missing-import': 'off',
        'n/no-missing-require': 'off',
        'n/no-unsupported-features/es-builtins': 'off',
        'n/no-unsupported-features/node-builtins': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
      },
    },
    {
      files: ['playground/**'],
      excludedFiles: '**/__tests__/**',
      rules: {
        'no-undef': 'off',
        'no-empty': 'off',
        'no-constant-condition': 'off',
        '@typescript-eslint/no-empty-function': 'off',
      },
    },
    {
      files: ['playground/**'],
      excludedFiles: [
        'playground/ssr-resolve/**',
        'playground/**/*{commonjs,cjs}*/**',
        'playground/**/*{commonjs,cjs}*',
        'playground/**/*dep*/**',
        'playground/resolve/browser-module-field2/index.web.js',
        'playground/resolve/browser-field/**',
        'playground/tailwind/**', // blocked by https://github.com/postcss/postcss-load-config/issues/239
      ],
      rules: {
        'i/no-commonjs': 'error',
      },
    },
    {
      files: ['playground/**/__tests__/**'],
      rules: {
        // engine field doesn't exist in playgrounds
        'n/no-unsupported-features/es-builtins': [
          'error',
          {
            version: pkg.engines.node,
          },
        ],
        'n/no-unsupported-features/node-builtins': [
          'error',
          {
            version: pkg.engines.node,
          },
        ],
      },
    },
    {
      files: [
        'playground/tsconfig-json/**',
        'playground/tsconfig-json-load-error/**',
      ],
      excludedFiles: '**/__tests__/**',
      rules: {
        '@typescript-eslint/ban-ts-comment': 'off',
      },
    },
    {
      files: ['*.js', '*.mjs', '*.cjs'],
      rules: {
        '@typescript-eslint/explicit-module-boundary-types': 'off',
      },
    },
    {
      files: ['*.d.ts'],
      rules: {
        '@typescript-eslint/triple-slash-reference': 'off',
      },
    },
  ],
  reportUnusedDisableDirectives: true,
})
