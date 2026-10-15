import regexp from 'eslint-plugin-regexp'
import { defineConfig } from 'oxlint'

export default defineConfig({
  options: {
    typeAware: true,
  },
  plugins: ['typescript', 'node', 'import', 'unicorn'],
  jsPlugins: ['eslint-plugin-n', 'eslint-plugin-regexp', '@e18e/eslint-plugin'],
  categories: {
    correctness: 'error',
  },
  settings: {
    node: {
      version: '^20.19.0 || >=22.12.0',
    },
  },
  ignorePatterns: [
    'packages/create-vite/template-*',
    '**/dist/**',
    '**/fixtures/**',
    '**/playground-temp/**',
    '**/temp/**',
    '**/.vitepress/cache/**',
    '**/*.snap',
    'playground/tsconfig-json-load-error/has-error/**',
  ],
  rules: {
    eqeqeq: ['warn', 'always', { null: 'never' }],
    'no-empty': ['warn', { allowEmptyCatch: true }],
    'prefer-const': ['warn', { destructuring: 'all' }],
    'no-restricted-globals': ['error', 'require', '__dirname', '__filename'],
    'no-empty-function': ['error', { allow: ['arrowFunctions'] }],
    'no-case-declarations': 'error',
    'no-fallthrough': 'error',
    'no-prototype-builtins': 'error',
    'no-redeclare': 'error',
    'no-unexpected-multiline': 'error',
    'no-array-constructor': 'error',
    'no-unused-vars': [
      'error',
      {
        args: 'all',
        argsIgnorePattern: '^_',
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    'no-var': 'error',

    'typescript/explicit-module-boundary-types': [
      'error',
      { allowArgumentsExplicitlyTypedAsAny: true },
    ],
    'typescript/no-empty-object-type': [
      'error',
      { allowInterfaces: 'with-single-extends' },
    ],
    'typescript/consistent-type-imports': [
      'error',
      { prefer: 'type-imports', disallowTypeAnnotations: false },
    ],
    'typescript/ban-ts-comment': 'error',
    'typescript/no-namespace': 'error',
    'typescript/no-require-imports': 'error',
    'typescript/no-unnecessary-type-constraint': 'error',
    'typescript/adjacent-overload-signatures': 'error',
    'typescript/ban-tslint-comment': 'error',
    'typescript/class-literal-property-style': 'error',
    'typescript/consistent-indexed-object-style': 'error',
    'typescript/consistent-type-assertions': 'error',
    'typescript/no-confusing-non-null-assertion': 'error',
    'typescript/no-unsafe-enum-comparison': 'error',
    'typescript/prefer-promise-reject-errors': 'error',
    'typescript/restrict-plus-operands': 'error',
    'typescript/dot-notation': 'error',
    'typescript/non-nullable-type-assertion-style': 'error',
    'typescript/prefer-find': 'error',
    'typescript/prefer-includes': 'error',
    'typescript/prefer-regexp-exec': 'error',

    // These type-aware rules are disabled for compatibility with the codebase.
    'typescript/await-thenable': 'off', // does not handle `void | Promise<void>` well
    'typescript/no-base-to-string': 'off', // does not matter for us
    'typescript/no-implied-eval': 'off', // we intentionally use `Function()`
    'typescript/no-floating-promises': 'off',
    'typescript/no-redundant-type-constituents': 'off', // hard to handle some cases
    'typescript/no-unnecessary-type-assertion': 'off',
    'typescript/prefer-string-starts-ends-with': 'off', // prefer indexed access for better performance
    'typescript/require-await': 'off', // does not handle inferred required async functions well
    'typescript/restrict-template-expressions': 'off', // does not matter for us
    'typescript/unbound-method': 'off',

    // These correctness rules are disabled for compatibility with the codebase.
    'typescript/no-misused-spread': 'off',
    'typescript/require-array-sort-compare': 'off',
    'unicorn/no-new-array': 'off',
    // https://github.com/oxc-project/oxc/issues/14895
    'typescript/consistent-generic-constructors': 'off',

    'import/no-duplicates': 'error',
    'import/default': 'off',

    'node/no-exports-assign': 'error',
    'n/no-unpublished-bin': 'error',
    'n/no-unsupported-features/es-builtins': 'error',
    'n/no-unsupported-features/node-builtins': [
      'error',
      {
        // TODO: remove this when we don't support Node 20 anymore
        ignores: ['Response', 'Request', 'fetch'],
      },
    ],
    'n/process-exit-as-throw': 'error',
    'n/hashbang': 'error',
    'n/no-missing-require': [
      'error',
      {
        // for try-catching yarn pnp
        allowModules: ['pnpapi', 'vite'],
        tryExtensions: ['.ts', '.js', '.jsx', '.tsx', '.d.ts'],
      },
    ],
    'n/no-extraneous-import': 'error',
    'n/no-extraneous-require': 'error',
    'unicorn/prefer-node-protocol': 'error',

    ...regexp.configs['flat/recommended'].rules,
    'regexp/prefer-regexp-exec': 'error',
    'regexp/prefer-regexp-test': 'error',
    // In some cases explicit letter casing is faster than the `i` flag.
    'regexp/use-ignore-case': 'off',

    'prefer-rest-params': 'error',
    'prefer-spread': 'error',
    'e18e/prefer-array-at': 'error',
    'e18e/prefer-array-fill': 'error',
    'e18e/prefer-includes': 'error',
    'e18e/prefer-array-to-reversed': 'error',
    'e18e/prefer-object-has-own': 'error',
    'e18e/prefer-nullish-coalescing': 'error',
  },
  overrides: [
    // vite/node
    {
      files: ['packages/vite/src/node/**/*.{,c,m}[jt]s{,x}'],
      rules: {
        'no-console': 'error',
      },
    },
    // playground/enforce-esm
    {
      files: ['playground/**/*.{,c,m}[jt]s{,x}'],
      excludeFiles: [
        'playground/ssr-resolve/**',
        'playground/**/*{commonjs,cjs}*/**',
        'playground/**/*{commonjs,cjs}*',
        'playground/**/*dep*/**',
        'playground/resolve/browser-module-field2/index.web.js',
        'playground/resolve/browser-field/**',
      ],
      rules: {
        'import/no-commonjs': 'error',
      },
    },
    // tests
    {
      files: ['**/__tests__/**/*.{,c,m}[jt]s{,x}'],
      rules: {
        'n/no-unsupported-features/node-builtins': [
          'error',
          { allowExperimental: true },
        ],
      },
    },
    // configs
    {
      files: [
        'packages/create-vite/tsdown.config.ts',
        'packages/plugin-legacy/tsdown.config.ts',
      ],
      rules: {
        'n/no-unsupported-features/node-builtins': [
          'error',
          { allowExperimental: true },
        ],
      },
    },
    // docs
    {
      files: ['docs/**/*.{,c,m}[jt]s{,x}'],
      rules: {
        'typescript/explicit-module-boundary-types': 'off',
        'n/no-unsupported-features/node-builtins': [
          'error',
          { allowExperimental: true },
        ],
      },
    },

    // disables/vite/client
    {
      files: ['packages/vite/src/client/**/*.{,c,m}[jt]s{,x}'],
      excludeFiles: ['**/__tests__/**'],
      rules: {
        'n/no-unsupported-features/node-builtins': 'off',
      },
    },
    // disables/playground
    {
      files: ['playground/**/*.{,c,m}[jt]s{,x}'],
      rules: {
        'n/no-extraneous-import': 'off',
        'n/no-extraneous-require': 'off',
        'n/no-unsupported-features/es-builtins': 'off',
        'n/no-unsupported-features/node-builtins': 'off',
        'typescript/explicit-module-boundary-types': 'off',
        'typescript/no-require-imports': 'off',
        'typescript/no-useless-default-assignment': 'off',
        'unicorn/no-empty-file': 'off',
        'no-unused-expressions': 'off',
        'no-unused-vars': 'off',
        'no-undef': 'off',
        'no-empty': 'off',
        'no-constant-condition': 'off',
        'no-constant-binary-expression': 'off',
        'no-eval': 'off',
        'no-restricted-globals': 'off',
        'no-useless-rename': 'off',
        'no-empty-function': 'off',
        'no-var': 'off',
      },
    },
    // disables/playground/tsconfig-json
    {
      files: [
        'playground/tsconfig-json/**/*.{,c,m}[jt]s{,x}',
        'playground/tsconfig-json-load-error/**/*.{,c,m}[jt]s{,x}',
      ],
      excludeFiles: ['**/__tests__/**'],
      rules: {
        'typescript/ban-ts-comment': 'off',
      },
    },
    // disables/dts
    {
      files: ['**/*.d.ts'],
      rules: {
        'n/no-extraneous-import': 'off',
        'typescript/consistent-indexed-object-style': 'off',
        'typescript/triple-slash-reference': 'off',
      },
    },
    // disables/tests
    {
      files: ['**/__tests__/**/*.{,c,m}[jt]s{,x}'],
      rules: {
        'no-console': 'off',
        'typescript/ban-ts-comment': 'off',
        'n/no-extraneous-import': 'off',
      },
    },
    // disables/dts-tests
    {
      files: ['**/__tests_dts__/**/*.{,c,m}[jt]s{,x}'],
      rules: {
        'typescript/no-useless-empty-export': 'off',
      },
    },
    // disables/typechecking
    {
      files: [
        '**/__tests__/**',
        'playground/**',
        'scripts/**',
        'vitest.config.ts',
        'vitest.config.e2e.ts',
      ],
      rules: {
        'typescript/prefer-promise-reject-errors': 'off',
        'typescript/dot-notation': 'off',
        'typescript/prefer-regexp-exec': 'off',
      },
    },
  ],
})
