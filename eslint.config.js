// @ts-check
import eslint from '@eslint/js'
import pluginN from 'eslint-plugin-n'
import pluginImportX from 'eslint-plugin-import-x'
import pluginRegExp from 'eslint-plugin-regexp'
import tseslint from 'typescript-eslint'
import { defineConfig } from 'eslint/config'
import globals from 'globals'

// Some rules work better with typechecking enabled, but as enabling it is slow,
// we only do so when linting in IDEs for now. If you want to lint with typechecking
// explicitly, set this to `true` manually.
const shouldTypeCheck = typeof process.env.VSCODE_PID === 'string'

export default defineConfig(
  {
    ignores: [
      'packages/create-vite/template-*',
      '**/dist/**',
      '**/fixtures/**',
      '**/playground-temp/**',
      '**/temp/**',
      '**/.vitepress/cache/**',
      '**/*.snap',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylistic,
  ...(shouldTypeCheck ? tseslint.configs.recommendedTypeCheckedOnly : []),
  ...(shouldTypeCheck ? tseslint.configs.stylisticTypeCheckedOnly : []),
  pluginRegExp.configs['flat/recommended'],
  {
    name: 'main',
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2022,
        isolatedDeclarations: true,
        projectService: shouldTypeCheck,
      },
      globals: {
        ...globals.es2023,
        ...globals.node,
      },
    },
    settings: {
      node: {
        version: '^20.19.0 || >=22.12.0',
      },
    },
    plugins: {
      n: pluginN,
      'import-x': pluginImportX,
    },
    rules: {
      'n/no-exports-assign': 'error',
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

      eqeqeq: ['warn', 'always', { null: 'never' }],
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'prefer-const': [
        'warn',
        {
          destructuring: 'all',
        },
      ],
      'no-restricted-globals': ['error', 'require', '__dirname', '__filename'],

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
      'n/prefer-node-protocol': 'error',

      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': [
        'error',
        { allowArgumentsExplicitlyTypedAsAny: true },
      ],
      '@typescript-eslint/no-empty-function': [
        'error',
        { allow: ['arrowFunctions'] },
      ],
      '@typescript-eslint/no-empty-object-type': [
        'error',
        { allowInterfaces: 'with-single-extends' },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-inferrable-types': 'off', // incompatible with `isolatedDeclarations`
      '@typescript-eslint/no-unused-vars': [
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
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', disallowTypeAnnotations: false },
      ],
      // disable rules set in @typescript-eslint/stylistic which conflict with current code
      // we should discuss if we want to enable these as they encourage consistent code
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/prefer-for-of': 'off',
      '@typescript-eslint/prefer-function-type': 'off',
      // disable typecheck-specific rules
      '@typescript-eslint/await-thenable': 'off', // does not handle `void | Promise<void>` well
      '@typescript-eslint/no-base-to-string': 'off', // does not matter for us
      '@typescript-eslint/no-implied-eval': 'off', // we intentionally use `Function()`
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off', // hard to handle some cases
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/only-throw-error': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/prefer-string-starts-ends-with': 'off', // prefer indexed access for better performance
      '@typescript-eslint/require-await': 'off', // does not handle inferred required async functions well
      '@typescript-eslint/restrict-template-expressions': 'off', // does not matter for us
      '@typescript-eslint/unbound-method': 'off',

      'import-x/no-duplicates': 'error',
      'import-x/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
        },
      ],

      'regexp/prefer-regexp-exec': 'error',
      'regexp/prefer-regexp-test': 'error',
      // in some cases using explicit letter-casing is more performant than the `i` flag
      'regexp/use-ignore-case': 'off',
    },
  },
  {
    name: 'vite/node',
    files: ['packages/vite/src/node/**/*.{,c,m}[jt]s{,x}'],
    rules: {
      'no-console': ['error'],
    },
  },
  {
    name: 'playground/enforce-esm',
    files: ['playground/**/*.{,c,m}[jt]s{,x}'],
    ignores: [
      'playground/ssr-resolve/**',
      'playground/**/*{commonjs,cjs}*/**',
      'playground/**/*{commonjs,cjs}*',
      'playground/**/*dep*/**',
      'playground/resolve/browser-module-field2/index.web.js',
      'playground/resolve/browser-field/**',
    ],
    rules: {
      'import-x/no-commonjs': 'error',
    },
  },
  {
    name: 'tests',
    files: ['**/__tests__/**/*.{,c,m}[jt]s{,x}'],
    rules: {
      'n/no-unsupported-features/node-builtins': [
        'error',
        { allowExperimental: true },
      ],
    },
  },
  {
    name: 'configs',
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

  {
    name: 'disables/vite/client',
    files: ['packages/vite/src/client/**/*.{,c,m}[jt]s{,x}'],
    ignores: ['**/__tests__/**'],
    rules: {
      'n/no-unsupported-features/node-builtins': 'off',
    },
  },
  {
    name: 'disables/playground',
    files: ['playground/**/*.{,c,m}[jt]s{,x}', 'docs/**/*.{,c,m}[jt]s{,x}'],
    rules: {
      'n/no-extraneous-import': 'off',
      'n/no-extraneous-require': 'off',
      'n/no-unsupported-features/es-builtins': 'off',
      'n/no-unsupported-features/node-builtins': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-undef': 'off',
      'no-empty': 'off',
      'no-constant-condition': 'off',
      'no-restricted-globals': 'off',
      '@typescript-eslint/no-empty-function': 'off',
    },
  },
  {
    name: 'disables/playground/tsconfig-json',
    files: [
      'playground/tsconfig-json/**/*.{,c,m}[jt]s{,x}',
      'playground/tsconfig-json-load-error/**/*.{,c,m}[jt]s{,x}',
    ],
    ignores: ['**/__tests__/**'],
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },
  {
    name: 'disables/js',
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
  {
    name: 'disables/dts',
    files: ['**/*.d.ts'],
    rules: {
      'n/no-extraneous-import': 'off',
      '@typescript-eslint/consistent-indexed-object-style': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },
  {
    name: 'disables/test',
    files: ['**/__tests__/**/*.{,c,m}[jt]s{,x}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'n/no-extraneous-import': 'off',
    },
  },
  {
    name: 'disables/test-dts',
    files: ['**/__tests_dts__/**/*.{,c,m}[jt]s{,x}'],
    rules: {
      // disable typecheck-specific rules
      '@typescript-eslint/no-duplicate-type-constituents': 'off',
    },
  },
  {
    name: 'disables/typechecking',
    files: [
      '**/*.js',
      '**/*.mjs',
      '**/*.cjs',
      '**/*.d.ts',
      '**/*.d.cts',
      '**/__tests__/**',
      'docs/**',
      'playground/**',
      'scripts/**',
      'vitest.config.ts',
      'vitest.config.e2e.ts',
    ],
    languageOptions: {
      parserOptions: {
        projectService: false,
      },
    },
    extends: [tseslint.configs.disableTypeChecked],
  },
)
