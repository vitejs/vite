import { defineConfig } from 'vite'

export default defineConfig({
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
  },
})
