module.exports = {
  define: {
    __EXP__: 'false',
    __STRING__: '"hello"',
    __NUMBER__: 123,
    __BOOLEAN__: true,
    __OBJ__: {
      foo: 1,
      bar: {
        baz: 2
      },
      process: {
        env: {
          SOMEVAR: '"PROCESS MAY BE PROPERTY"'
        }
      }
    },
    __VAR_NAME__: false,
    'process.env.SOMEVAR': '"SOMEVAR"'
  }
}
