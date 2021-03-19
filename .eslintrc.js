module.exports = {
  root: true,
  extends: ['plugin:node/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2020
  },
  plugins: ['spellcheck'],
  rules: {
    'no-debugger': ['error'],
    'node/no-missing-import': [
      'error',
      {
        allowModules: ['types', 'estree', 'testUtils'],
        tryExtensions: ['.ts', '.js', '.jsx', '.tsx', '.d.ts']
      }
    ],
    'node/no-missing-require': [
      'error',
      {
        // for try-catching yarn pnp
        allowModules: ['pnpapi'],
        tryExtensions: ['.ts', '.js', '.jsx', '.tsx', '.d.ts']
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
            `lazy load a dependency, use (await import('dependency')).default instead.`
        })
      )
    ],
    'node/no-extraneous-import': [
      'error',
      {
        allowModules: ['vite', 'less', 'sass']
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
    'no-process-exit': 'off',

    'spellcheck/spell-checker': [
      'warn',
      {
        minLength: 4,
        skipWords: [
          'applescript',
          'argv',
          'avif',
          'basedir',
          'behaviour', // Change to behavior?
          'brotli',
          'builtins',
          'chokidar',
          'codeframe',
          'commonjs',
          'compat',
          'cors',
          'cpuprofile',
          'crossorigin',
          'darwin',
          'debounce',
          'declarator',
          'dedupe',
          'devtools',
          'doctype',
          'dotenv',
          'ecma',
          'encipherment',
          'esbuild',
          'esnext',
          'estree',
          'eswalk',
          'etag',
          'execa',
          'fallthrough',
          'favicon',
          'fe80',
          'fetchable',
          'filenames',
          'filepath',
          'firefox',
          'flac',
          'globbing',
          'href',
          'iife',
          'inlined',
          'interop',
          'javascript',
          'jsconfig',
          'jsnext',
          'lang',
          'langs',
          'localdomain',
          'localhost',
          'lockfile',
          'lockfiles',
          'lstat',
          'metafile',
          'middlewares',
          'minification',
          'minifier',
          'minify',
          'minifying',
          'mjsconfig',
          'modulepreload',
          'monorepos',
          'mtime',
          'namespace',
          'natively',
          'nginx',
          'nullable',
          'onwarn',
          'osascript',
          'outdir',
          'outfile',
          'pathname',
          'pems',
          'performant',
          'pnpapi',
          'pnpm',
          'posix',
          'postcss',
          'prepend',
          'profiler',
          'proxying',
          'readdir',
          'readline',
          'readonly',
          'realpath',
          'rebase',
          'rebased',
          'renderer',
          'replacer',
          'rerender',
          'resolvers',
          'rewriter',
          'rmdir',
          'rollup',
          'scannable',
          'selfsigned',
          'sirv',
          'sourcefile',
          'srcs',
          'srcset',
          'stdin',
          'stdout',
          'stringified',
          'styl',
          'subfolder',
          'subpath',
          'toplevel',
          'transpile',
          'treeshake',
          'tsconfig',
          'typeof',
          'uint',
          'unary',
          'unescaped',
          'unix',
          'unlink',
          'urls',
          'utf8',
          'vite',
          'vitejs',
          'wasm',
          'webm',
          'webp',
          'webpack',
          'whitespaces',
          'woff2',
          'xlink',
          'yaml',
          "'vue'"
        ]
      }
    ]
  },
  overrides: [
    {
      files: ['packages/vite/src/node/**'],
      rules: {
        'no-console': ['error']
      }
    },
    {
      files: ['packages/playground/**'],
      rules: {
        'node/no-extraneous-import': 'off',
        'node/no-extraneous-require': 'off'
      }
    },
    {
      files: ['packages/create-app/template-*/**'],
      rules: {
        'node/no-missing-import': 'off'
      }
    }
  ]
}
