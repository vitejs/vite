import { defineConfig } from 'vite'

/**
 * Plugin to test that env imports with query parameters work correctly
 * This only runs in dev mode to verify the fix for issue #20997
 */
function testEnvQueryParamsPlugin() {
  return {
    name: 'test-env-query-params',
    apply: 'serve',
    transform(code, id) {
      // Add the test import to index.html's inline script
      if (id.includes('index.html') && code.includes('.env-with-query')) {
        return code.replace(
          "text('.optional-env', optionalEnv)",
          `text('.optional-env', optionalEnv)

  // Test importing env with query parameters
  import('/@vite/env?foo')
    .then(() => {
      text('.env-with-query', 'success')
    })
    .catch((err) => {
      text('.env-with-query', \`error: \${err.message}\`)
    })`,
        )
      }
    },
  }
}

export default defineConfig({
  plugins: [testEnvQueryParamsPlugin()],
  define: {
    __EXP__: 'false',
    __STRING__: '"hello"',
    __NUMBER__: 123,
    __BOOLEAN__: true,
    __UNDEFINED__: undefined,
    __OBJ__: {
      foo: 1,
      bar: {
        baz: 2,
      },
      process: {
        env: {
          SOMEVAR: '"PROCESS MAY BE PROPERTY"',
        },
      },
    },
    'process.env.NODE_ENV': '"dev"',
    'process.env.SOMEVAR': '"SOMEVAR"',
    'process.env': {
      NODE_ENV: 'dev',
      SOMEVAR: 'SOMEVAR',
      OTHER: 'works',
    },
    $DOLLAR: 456,
    ÖUNICODE_LETTERɵ: 789,
    __VAR_NAME__: false,
    __STRINGIFIED_OBJ__: JSON.stringify({ foo: true }),
    'import.meta.env.SOME_IDENTIFIER': '__VITE_SOME_IDENTIFIER__',
  },
  environments: {
    client: {
      define: {
        __DEFINE_IN_ENVIRONMENT__: '"defined only in client"',
      },
    },
  },
})
