import { defineConfig } from 'vite'

/**
 * Plugin to test that env imports with query parameters work correctly (#20997)
 */
function testEnvQueryParamsPlugin() {
  let isBuild = true
  return {
    name: 'test-env-query-params',
    configResolved(config) {
      isBuild = config.command === 'build'
    },
    transform(code, id) {
      if (
        id.includes('index.html') &&
        code.includes('__VITE_ENV_WITH_QUERY__')
      ) {
        return code.replace(
          '__VITE_ENV_WITH_QUERY__',
          JSON.stringify(isBuild ? 'data:text/javascript,' : '/@vite/env?foo'),
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
